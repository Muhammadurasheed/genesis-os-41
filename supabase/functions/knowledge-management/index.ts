import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      }
    )

    const authHeader = req.headers.get('Authorization')!
    const token = authHeader.replace('Bearer ', '')
    const { data: { user } } = await supabase.auth.getUser(token)

    if (!user) {
      throw new Error('Unauthorized')
    }

    const { method, url } = req
    const urlPath = new URL(url).pathname
    const pathSegments = urlPath.split('/').filter(Boolean)
    const action = pathSegments[pathSegments.length - 1]

    switch (method) {
      case 'POST':
        if (action === 'upload') {
          return await handleFileUpload(req, supabase, user.id)
        } else if (action === 'embed') {
          return await handleEmbedContent(req, supabase, user.id)
        } else if (action === 'search') {
          return await handleSemanticSearch(req, supabase, user.id)
        }
        break
      
      case 'GET':
        if (action === 'knowledge-bases') {
          return await getKnowledgeBases(supabase, user.id)
        } else if (action === 'process-status') {
          return await getProcessingStatus(req, supabase, user.id)
        }
        break
      
      case 'DELETE':
        return await deleteKnowledgeBase(req, supabase, user.id)
    }

    return new Response(
      JSON.stringify({ error: 'Method not found' }),
      { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})

async function handleFileUpload(req: Request, supabase: any, userId: string) {
  const formData = await req.formData()
  const file = formData.get('file') as File
  const name = formData.get('name') as string
  const type = formData.get('type') as string || 'documents'

  if (!file) {
    throw new Error('No file provided')
  }

  // Create knowledge base record
  const { data: knowledgeBase, error: kbError } = await supabase
    .from('knowledge_bases')
    .insert({
      owner_id: userId,
      name: name || file.name,
      type,
      indexing_status: 'pending',
      file_metadata: {
        original_name: file.name,
        size: file.size,
        mime_type: file.type
      }
    })
    .select()
    .single()

  if (kbError) throw kbError

  // Upload file to storage
  const fileName = `${userId}/${knowledgeBase.id}/${file.name}`
  const { error: uploadError } = await supabase.storage
    .from('knowledge-files')
    .upload(fileName, file)

  if (uploadError) throw uploadError

  // Update knowledge base with file path
  await supabase
    .from('knowledge_bases')
    .update({ 
      file_path: fileName,
      indexing_status: 'processing'
    })
    .eq('id', knowledgeBase.id)

  // Trigger processing
  await processKnowledgeFile(supabase, knowledgeBase.id, fileName, file.type)

  return new Response(
    JSON.stringify({ 
      success: true, 
      knowledge_base_id: knowledgeBase.id,
      message: 'File uploaded and processing started'
    }),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  )
}

async function processKnowledgeFile(supabase: any, knowledgeBaseId: string, filePath: string, mimeType: string) {
  try {
    // Download file content
    const { data: fileData } = await supabase.storage
      .from('knowledge-files')
      .download(filePath)

    if (!fileData) throw new Error('Failed to download file')

    let content = ''
    
    // Extract content based on file type
    if (mimeType === 'text/plain' || mimeType === 'text/csv') {
      content = await fileData.text()
    } else if (mimeType === 'application/json') {
      const jsonData = await fileData.text()
      content = JSON.stringify(JSON.parse(jsonData), null, 2)
    } else {
      // For PDFs and other formats, we'd use specialized libraries
      // For now, treat as text
      content = await fileData.text()
    }

    // Chunk content into smaller pieces
    const chunks = chunkContent(content, 1000) // 1000 character chunks

    // Generate embeddings for each chunk
    const memorySegments = []
    for (let i = 0; i < chunks.length; i++) {
      const chunk = chunks[i]
      
      // Generate embedding using a hypothetical embedding service
      // In production, you'd use OpenAI embeddings or similar
      const embedding = await generateEmbedding(chunk)
      
      memorySegments.push({
        knowledge_base_id: knowledgeBaseId,
        content: chunk,
        embedding: embedding,
        chunk_index: i,
        importance_score: calculateImportanceScore(chunk),
        tags: extractTags(chunk)
      })
    }

    // Store memory segments
    const { error: segmentError } = await supabase
      .from('memory_segments')
      .insert(memorySegments)

    if (segmentError) throw segmentError

    // Update knowledge base status
    await supabase
      .from('knowledge_bases')
      .update({ 
        indexing_status: 'completed',
        last_updated: new Date().toISOString(),
        chunk_count: chunks.length
      })
      .eq('id', knowledgeBaseId)

  } catch (error) {
    console.error('Processing error:', error)
    
    // Update knowledge base with error status
    await supabase
      .from('knowledge_bases')
      .update({ 
        indexing_status: 'failed',
        error_message: error.message
      })
      .eq('id', knowledgeBaseId)
  }
}

function chunkContent(content: string, maxChunkSize: number): string[] {
  const sentences = content.split(/[.!?]+/).filter(s => s.trim().length > 0)
  const chunks = []
  let currentChunk = ''

  for (const sentence of sentences) {
    if (currentChunk.length + sentence.length > maxChunkSize && currentChunk.length > 0) {
      chunks.push(currentChunk.trim())
      currentChunk = sentence
    } else {
      currentChunk += (currentChunk ? '. ' : '') + sentence
    }
  }

  if (currentChunk.trim().length > 0) {
    chunks.push(currentChunk.trim())
  }

  return chunks
}

async function generateEmbedding(text: string): Promise<number[]> {
  // Placeholder for embedding generation
  // In production, use OpenAI embeddings or similar service
  const normalized = text.toLowerCase().replace(/[^\w\s]/g, '')
  const words = normalized.split(/\s+/)
  
  // Simple hash-based embedding (not for production use)
  const embedding = new Array(384).fill(0)
  for (let i = 0; i < words.length; i++) {
    const word = words[i]
    for (let j = 0; j < word.length; j++) {
      const charCode = word.charCodeAt(j)
      embedding[charCode % 384] += 1
    }
  }
  
  // Normalize
  const magnitude = Math.sqrt(embedding.reduce((sum, val) => sum + val * val, 0))
  return embedding.map(val => magnitude > 0 ? val / magnitude : 0)
}

function calculateImportanceScore(content: string): number {
  // Simple importance scoring based on content characteristics
  let score = 0.5 // Base score
  
  // Longer content might be more important
  if (content.length > 500) score += 0.1
  
  // Content with numbers/data
  if (/\d+/.test(content)) score += 0.1
  
  // Content with keywords indicating importance
  const importantKeywords = ['important', 'critical', 'key', 'main', 'primary', 'essential']
  if (importantKeywords.some(keyword => content.toLowerCase().includes(keyword))) {
    score += 0.2
  }
  
  return Math.min(score, 1.0)
}

function extractTags(content: string): string[] {
  const tags = []
  
  // Extract potential tags based on capitalized words, technical terms, etc.
  const words = content.match(/\b[A-Z][a-z]+\b/g) || []
  const technicalTerms = content.match(/\b[A-Z]{2,}\b/g) || []
  
  tags.push(...words.slice(0, 5)) // First 5 capitalized words
  tags.push(...technicalTerms.slice(0, 3)) // First 3 technical terms
  
  return [...new Set(tags.filter(tag => tag.length > 2))]
}

async function handleSemanticSearch(req: Request, supabase: any, userId: string) {
  const { query, knowledge_base_id, limit = 10 } = await req.json()
  
  if (!query) {
    throw new Error('Query is required')
  }

  // Generate embedding for search query
  const queryEmbedding = await generateEmbedding(query)
  
  // Build SQL query for semantic search
  let sqlQuery = supabase
    .from('memory_segments')
    .select(`
      *,
      knowledge_bases!inner(id, name, owner_id)
    `)
    .eq('knowledge_bases.owner_id', userId)
    .limit(limit)

  if (knowledge_base_id) {
    sqlQuery = sqlQuery.eq('knowledge_base_id', knowledge_base_id)
  }

  const { data: segments, error } = await sqlQuery

  if (error) throw error

  // Calculate similarity scores (cosine similarity)
  const results = segments.map(segment => {
    const similarity = cosineSimilarity(queryEmbedding, segment.embedding)
    return {
      ...segment,
      similarity_score: similarity
    }
  }).sort((a, b) => b.similarity_score - a.similarity_score)

  return new Response(
    JSON.stringify({ results }),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  )
}

function cosineSimilarity(a: number[], b: number[]): number {
  if (a.length !== b.length) return 0
  
  let dotProduct = 0
  let normA = 0
  let normB = 0
  
  for (let i = 0; i < a.length; i++) {
    dotProduct += a[i] * b[i]
    normA += a[i] * a[i]
    normB += b[i] * b[i]
  }
  
  return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB))
}

async function getKnowledgeBases(supabase: any, userId: string) {
  const { data, error } = await supabase
    .from('knowledge_bases')
    .select(`
      *,
      memory_segments(count)
    `)
    .eq('owner_id', userId)
    .order('created_at', { ascending: false })

  if (error) throw error

  return new Response(
    JSON.stringify({ knowledge_bases: data }),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  )
}

async function getProcessingStatus(req: Request, supabase: any, userId: string) {
  const url = new URL(req.url)
  const knowledgeBaseId = url.searchParams.get('id')
  
  if (!knowledgeBaseId) {
    throw new Error('Knowledge base ID is required')
  }

  const { data, error } = await supabase
    .from('knowledge_bases')
    .select('id, indexing_status, chunk_count, error_message, last_updated')
    .eq('id', knowledgeBaseId)
    .eq('owner_id', userId)
    .single()

  if (error) throw error

  return new Response(
    JSON.stringify({ status: data }),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  )
}

async function deleteKnowledgeBase(req: Request, supabase: any, userId: string) {
  const url = new URL(req.url)
  const knowledgeBaseId = url.searchParams.get('id')
  
  if (!knowledgeBaseId) {
    throw new Error('Knowledge base ID is required')
  }

  // Delete memory segments first
  await supabase
    .from('memory_segments')
    .delete()
    .eq('knowledge_base_id', knowledgeBaseId)

  // Delete knowledge base
  const { error } = await supabase
    .from('knowledge_bases')
    .delete()
    .eq('id', knowledgeBaseId)
    .eq('owner_id', userId)

  if (error) throw error

  return new Response(
    JSON.stringify({ success: true }),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  )
}