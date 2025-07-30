import { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '../ui/dialog';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/Card';
import { Copy, Mail, Link, Users, Crown, Eye, Edit } from 'lucide-react';
import { Badge } from '../ui/badge';
import { useToast } from '../ui/use-toast';
import { Separator } from '../ui/separator';

interface InviteCollaboratorDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  workflowId?: string;
}

export function InviteCollaboratorDialog({ open, onOpenChange, workflowId = 'workflow-123' }: InviteCollaboratorDialogProps) {
  const [emails, setEmails] = useState('');
  const [permission, setPermission] = useState<'viewer' | 'editor' | 'admin'>('editor');
  const [isGeneratingLink, setIsGeneratingLink] = useState(false);
  const [shareableLink, setShareableLink] = useState('');
  const { toast } = useToast();

  const handleEmailInvite = async () => {
    if (!emails.trim()) {
      toast({ title: "Error", description: "Please enter at least one email address" });
      return;
    }

    const emailList = emails.split(',').map(email => email.trim()).filter(Boolean);
    
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      toast({
        title: "Invitations Sent!",
        description: `Successfully sent ${emailList.length} invitation(s) with ${permission} permissions.`,
      });
      
      setEmails('');
      onOpenChange(false);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to send invitations. Please try again.",
        variant: "destructive"
      });
    }
  };

  const generateShareableLink = async () => {
    setIsGeneratingLink(true);
    try {
      // Simulate link generation
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const link = `https://genesis.dev/canvas/${workflowId}?token=abc123&role=${permission}`;
      setShareableLink(link);
      
      toast({
        title: "Link Generated!",
        description: "Your shareable link is ready to copy.",
      });
    } catch (error) {
      toast({
        title: "Error", 
        description: "Failed to generate link. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsGeneratingLink(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: "Copied!",
      description: "Link copied to clipboard.",
    });
  };

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'admin': return <Crown className="w-4 h-4 text-yellow-500" />;
      case 'editor': return <Edit className="w-4 h-4 text-blue-500" />;
      case 'viewer': return <Eye className="w-4 h-4 text-green-500" />;
      default: return <Users className="w-4 h-4" />;
    }
  };

  const getRoleDescription = (role: string) => {
    switch (role) {
      case 'admin': return 'Full access to edit, share, and manage workflow';
      case 'editor': return 'Can edit nodes, connections, and workflow settings';
      case 'viewer': return 'Can view and comment but not edit workflow';
      default: return 'Standard access level';
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Users className="w-5 h-5 text-primary" />
            Invite Collaborators
          </DialogTitle>
          <DialogDescription>
            Invite your team to collaborate on this AI workflow canvas in real-time.
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="email" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="email" className="flex items-center gap-2">
              <Mail className="w-4 h-4" />
              Email Invite
            </TabsTrigger>
            <TabsTrigger value="link" className="flex items-center gap-2">
              <Link className="w-4 h-4" />
              Share Link
            </TabsTrigger>
          </TabsList>

          <TabsContent value="email" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Send Email Invitations</CardTitle>
                <CardDescription>
                  Enter email addresses separated by commas to send personalized invites.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="emails">Email Addresses</Label>
                  <Input
                    id="emails"
                    placeholder="john@company.com, sarah@company.com, ..."
                    value={emails}
                    onChange={(e) => setEmails(e.target.value)}
                    className="min-h-[80px]"
                  />
                </div>

                <div className="space-y-3">
                  <Label>Permission Level</Label>
                  <div className="grid grid-cols-3 gap-3">
                    {['viewer', 'editor', 'admin'].map((role) => (
                      <Card 
                        key={role}
                        className={`cursor-pointer transition-all hover:shadow-md ${
                          permission === role ? 'ring-2 ring-primary bg-primary/5' : ''
                        }`}
                        onClick={() => setPermission(role as any)}
                      >
                        <CardContent className="p-3">
                          <div className="flex items-center gap-2 mb-2">
                            {getRoleIcon(role)}
                            <span className="font-medium capitalize">{role}</span>
                          </div>
                          <p className="text-xs text-muted-foreground">
                            {getRoleDescription(role)}
                          </p>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>

                <Button onClick={handleEmailInvite} className="w-full" size="lg">
                  <Mail className="w-4 h-4 mr-2" />
                  Send Invitations
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="link" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Generate Shareable Link</CardTitle>
                <CardDescription>
                  Create a secure link that you can share with your team members.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <Label>Access Level for Link</Label>
                  <div className="flex gap-2">
                    {['viewer', 'editor'].map((role) => (
                      <Button
                        key={role}
                        variant={permission === role ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => setPermission(role as any)}
                        className="flex items-center gap-2"
                      >
                        {getRoleIcon(role)}
                        <span className="capitalize">{role}</span>
                      </Button>
                    ))}
                  </div>
                </div>

                <Button 
                  onClick={generateShareableLink} 
                  disabled={isGeneratingLink}
                  className="w-full"
                  size="lg"
                >
                  {isGeneratingLink ? (
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                      Generating...
                    </div>
                  ) : (
                    <>
                      <Link className="w-4 h-4 mr-2" />
                      Generate Shareable Link
                    </>
                  )}
                </Button>

                {shareableLink && (
                  <Card className="bg-muted/50">
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          <Label className="text-sm font-medium">Shareable Link</Label>
                          <p className="text-sm text-muted-foreground truncate">
                            {shareableLink}
                          </p>
                        </div>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => copyToClipboard(shareableLink)}
                        >
                          <Copy className="w-4 h-4" />
                        </Button>
                      </div>
                      <div className="flex items-center gap-2 mt-2">
                        {getRoleIcon(permission)}
                        <Badge variant="secondary" className="text-xs">
                          {permission} access
                        </Badge>
                      </div>
                    </CardContent>
                  </Card>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        <Separator />

        <div className="space-y-2">
          <Label className="text-sm font-medium">Current Collaborators</Label>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Users className="w-4 h-4" />
            <span>3 active collaborators</span>
            <Badge variant="outline" className="ml-auto">
              Real-time sync enabled
            </Badge>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}