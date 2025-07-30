import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface CollaborationEvent {
  type: 'cursor' | 'selection' | 'canvas_update' | 'voice_command' | 'user_join' | 'user_leave'
  userId: string
  userName: string
  data: any
  timestamp: string
  canvasId: string
}

interface CanvasState {
  nodes: any[]
  edges: any[]
  version: number
  lastModified: string
  activeUsers: string[]
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: req.headers.get('Authorization')! },
        },
      }
    )

    // Get user from auth
    const { data: { user }, error: authError } = await supabaseClient.auth.getUser()
    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { 
          status: 401, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    const { action, canvasId, event, canvasState } = await req.json()

    switch (action) {
      case 'join_canvas':
        return await joinCanvas(supabaseClient, canvasId, user)
      case 'leave_canvas':
        return await leaveCanvas(supabaseClient, canvasId, user.id)
      case 'broadcast_event':
        return await broadcastEvent(supabaseClient, canvasId, event, user)
      case 'sync_canvas':
        return await syncCanvas(supabaseClient, canvasId, canvasState, user.id)
      case 'get_canvas_state':
        return await getCanvasState(supabaseClient, canvasId, user.id)
      case 'get_active_users':
        return await getActiveUsers(supabaseClient, canvasId)
      default:
        return new Response(
          JSON.stringify({ error: 'Invalid action' }),
          { 
            status: 400, 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          }
        )
    }
  } catch (error) {
    console.error('Collaboration error:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )
  }
})

async function joinCanvas(supabaseClient: any, canvasId: string, user: any) {
  console.log(`User ${user.id} joining canvas ${canvasId}`)
  
  // Update or insert user presence
  const { error: presenceError } = await supabaseClient
    .from('canvas_presence')
    .upsert({
      canvas_id: canvasId,
      user_id: user.id,
      user_name: user.user_metadata?.full_name || user.email,
      status: 'active',
      last_seen: new Date().toISOString(),
      cursor_position: { x: 0, y: 0 },
      color: generateUserColor(user.id)
    }, {
      onConflict: 'canvas_id,user_id'
    })

  if (presenceError) {
    throw new Error(`Failed to join canvas: ${presenceError.message}`)
  }

  // Broadcast join event
  await broadcastCanvasEvent(supabaseClient, canvasId, {
    type: 'user_join',
    userId: user.id,
    userName: user.user_metadata?.full_name || user.email,
    data: { color: generateUserColor(user.id) },
    timestamp: new Date().toISOString(),
    canvasId
  })

  // Get current canvas state
  const canvasState = await getCanvasState(supabaseClient, canvasId, user.id)

  return new Response(
    JSON.stringify({ 
      success: true, 
      message: 'Joined canvas successfully',
      canvasState: canvasState.body ? JSON.parse(await canvasState.text()) : null
    }),
    { 
      status: 200, 
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    }
  )
}

async function leaveCanvas(supabaseClient: any, canvasId: string, userId: string) {
  console.log(`User ${userId} leaving canvas ${canvasId}`)
  
  // Update presence status
  const { error } = await supabaseClient
    .from('canvas_presence')
    .update({
      status: 'inactive',
      last_seen: new Date().toISOString()
    })
    .eq('canvas_id', canvasId)
    .eq('user_id', userId)

  if (error) {
    console.error('Error updating presence:', error)
  }

  // Broadcast leave event
  await broadcastCanvasEvent(supabaseClient, canvasId, {
    type: 'user_leave',
    userId,
    userName: '',
    data: {},
    timestamp: new Date().toISOString(),
    canvasId
  })

  return new Response(
    JSON.stringify({ success: true, message: 'Left canvas successfully' }),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  )
}

async function broadcastEvent(supabaseClient: any, canvasId: string, event: CollaborationEvent, user: any) {
  // Update user presence with latest activity
  const updates: any = {
    last_seen: new Date().toISOString(),
    status: 'active'
  }

  // Update cursor position if it's a cursor event
  if (event.type === 'cursor' && event.data.position) {
    updates.cursor_position = event.data.position
  }

  await supabaseClient
    .from('canvas_presence')
    .update(updates)
    .eq('canvas_id', canvasId)
    .eq('user_id', user.id)

  // Broadcast the event
  await broadcastCanvasEvent(supabaseClient, canvasId, {
    ...event,
    userId: user.id,
    userName: user.user_metadata?.full_name || user.email,
    timestamp: new Date().toISOString(),
    canvasId
  })

  return new Response(
    JSON.stringify({ success: true, message: 'Event broadcasted successfully' }),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  )
}

async function syncCanvas(supabaseClient: any, canvasId: string, canvasState: CanvasState, userId: string) {
  console.log(`Syncing canvas ${canvasId} for user ${userId}`)
  
  try {
    // Update canvas state in database
    const { error: updateError } = await supabaseClient
      .from('canvas_states')
      .upsert({
        id: canvasId,
        nodes: canvasState.nodes,
        edges: canvasState.edges,
        version: (canvasState.version || 0) + 1,
        last_modified: new Date().toISOString(),
        last_modified_by: userId,
        active_users: canvasState.activeUsers || []
      }, {
        onConflict: 'id'
      })

    if (updateError) {
      throw new Error(`Failed to sync canvas: ${updateError.message}`)
    }

    // Broadcast canvas update event
    await broadcastCanvasEvent(supabaseClient, canvasId, {
      type: 'canvas_update',
      userId,
      userName: '',
      data: {
        nodes: canvasState.nodes,
        edges: canvasState.edges,
        version: canvasState.version + 1
      },
      timestamp: new Date().toISOString(),
      canvasId
    })

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Canvas synced successfully',
        version: canvasState.version + 1
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    console.error('Canvas sync error:', error)
    throw error
  }
}

async function getCanvasState(supabaseClient: any, canvasId: string, userId: string) {
  const { data, error } = await supabaseClient
    .from('canvas_states')
    .select('*')
    .eq('id', canvasId)
    .single()

  if (error && error.code !== 'PGRST116') { // PGRST116 = not found
    throw new Error(`Failed to get canvas state: ${error.message}`)
  }

  // If canvas doesn't exist, create it
  if (!data) {
    const { data: newCanvas, error: createError } = await supabaseClient
      .from('canvas_states')
      .insert({
        id: canvasId,
        nodes: [],
        edges: [],
        version: 0,
        last_modified: new Date().toISOString(),
        last_modified_by: userId,
        active_users: [userId]
      })
      .select()
      .single()

    if (createError) {
      throw new Error(`Failed to create canvas: ${createError.message}`)
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        canvasState: newCanvas 
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }

  return new Response(
    JSON.stringify({ 
      success: true, 
      canvasState: data 
    }),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  )
}

async function getActiveUsers(supabaseClient: any, canvasId: string) {
  const { data, error } = await supabaseClient
    .from('canvas_presence')
    .select('*')
    .eq('canvas_id', canvasId)
    .eq('status', 'active')
    .gte('last_seen', new Date(Date.now() - 30000).toISOString()) // Last 30 seconds

  if (error) {
    throw new Error(`Failed to get active users: ${error.message}`)
  }

  return new Response(
    JSON.stringify({ 
      success: true, 
      activeUsers: data || []
    }),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  )
}

async function broadcastCanvasEvent(supabaseClient: any, canvasId: string, event: CollaborationEvent) {
  // Store event in collaboration_events table for persistence
  const { error } = await supabaseClient
    .from('collaboration_events')
    .insert({
      canvas_id: canvasId,
      event_type: event.type,
      user_id: event.userId,
      user_name: event.userName,
      event_data: event.data,
      timestamp: event.timestamp
    })

  if (error) {
    console.error('Failed to store collaboration event:', error)
  }

  // In a real implementation, this would use Supabase Realtime
  // For now, we'll rely on polling from the frontend
}

function generateUserColor(userId: string): string {
  const colors = [
    '#8b5cf6', '#06b6d4', '#10b981', '#f59e0b', 
    '#ef4444', '#ec4899', '#6366f1', '#14b8a6'
  ]
  
  // Generate a consistent color based on user ID
  let hash = 0
  for (let i = 0; i < userId.length; i++) {
    hash = userId.charCodeAt(i) + ((hash << 5) - hash)
  }
  
  return colors[Math.abs(hash) % colors.length]
}