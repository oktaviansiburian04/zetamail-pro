import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Send } from "lucide-react";

interface ComposeDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  userEmail: string;
  userId: string;
}

const ComposeDialog = ({ open, onOpenChange, userEmail, userId }: ComposeDialogProps) => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [to, setTo] = useState("");
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    // Validate recipient email
    const emailRegex = /^[^\s@]+@zetacorp\.xyz$/;
    if (!emailRegex.test(to)) {
      toast({
        title: "Invalid Recipient",
        description: "Recipient must have a @zetacorp.xyz email address",
        variant: "destructive",
      });
      setLoading(false);
      return;
    }

    // Save to sent folder
    const { error } = await supabase.from("emails").insert({
      user_id: userId,
      sender: userEmail,
      recipient: to,
      subject: subject,
      body: body,
      is_sent: true,
      is_read: true,
    });

    if (error) {
      toast({
        title: "Error",
        description: "Failed to send email",
        variant: "destructive",
      });
    } else {
      // Check if recipient exists in our system
      const { data: recipientData } = await supabase
        .from("profiles")
        .select("user_id")
        .eq("email", to)
        .maybeSingle();

      if (recipientData) {
        // Deliver to recipient's inbox
        await supabase.from("emails").insert({
          user_id: recipientData.user_id,
          sender: userEmail,
          recipient: to,
          subject: subject,
          body: body,
          is_sent: false,
          is_read: false,
        });
      }

      toast({
        title: "Success",
        description: "Email sent successfully",
      });

      setTo("");
      setSubject("");
      setBody("");
      onOpenChange(false);
    }
    setLoading(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Compose New Email</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSend} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="to">To</Label>
            <Input
              id="to"
              type="email"
              placeholder="recipient@zetacorp.xyz"
              value={to}
              onChange={(e) => setTo(e.target.value)}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="subject">Subject</Label>
            <Input
              id="subject"
              type="text"
              placeholder="Email subject"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="body">Message</Label>
            <Textarea
              id="body"
              placeholder="Write your message..."
              value={body}
              onChange={(e) => setBody(e.target.value)}
              rows={10}
              required
            />
          </div>
          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              <Send className="h-4 w-4 mr-2" />
              {loading ? "Sending..." : "Send Email"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default ComposeDialog;