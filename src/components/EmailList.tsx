import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Mail, MailOpen, Star, Archive, Trash2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { formatDistanceToNow } from "date-fns";
import EmailView from "./EmailView";

interface Email {
  id: string;
  sender: string;
  recipient: string;
  subject: string;
  body: string;
  is_read: boolean;
  is_starred: boolean;
  is_archived: boolean;
  is_sent: boolean;
  created_at: string;
}

interface EmailListProps {
  userId: string;
}

const EmailList = ({ userId }: EmailListProps) => {
  const [emails, setEmails] = useState<Email[]>([]);
  const [selectedEmail, setSelectedEmail] = useState<Email | null>(null);
  const [filter, setFilter] = useState<"inbox" | "sent">("inbox");
  const { toast } = useToast();

  useEffect(() => {
    fetchEmails();

    const channel = supabase
      .channel("emails")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "emails",
          filter: `user_id=eq.${userId}`,
        },
        () => {
          fetchEmails();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId, filter]);

  const fetchEmails = async () => {
    const { data, error } = await supabase
      .from("emails")
      .select("*")
      .eq("user_id", userId)
      .eq("is_sent", filter === "sent")
      .eq("is_archived", false)
      .order("created_at", { ascending: false });

    if (error) {
      toast({
        title: "Error",
        description: "Failed to fetch emails",
        variant: "destructive",
      });
    } else {
      setEmails(data || []);
    }
  };

  const markAsRead = async (emailId: string) => {
    await supabase.from("emails").update({ is_read: true }).eq("id", emailId);
  };

  const toggleStar = async (emailId: string, currentState: boolean) => {
    await supabase.from("emails").update({ is_starred: !currentState }).eq("id", emailId);
  };

  const deleteEmail = async (emailId: string) => {
    const { error } = await supabase.from("emails").delete().eq("id", emailId);
    if (error) {
      toast({
        title: "Error",
        description: "Failed to delete email",
        variant: "destructive",
      });
    } else {
      toast({
        title: "Success",
        description: "Email deleted",
      });
      if (selectedEmail?.id === emailId) {
        setSelectedEmail(null);
      }
    }
  };

  if (selectedEmail) {
    return (
      <EmailView
        email={selectedEmail}
        onBack={() => setSelectedEmail(null)}
        onDelete={() => deleteEmail(selectedEmail.id)}
        onToggleStar={() => toggleStar(selectedEmail.id, selectedEmail.is_starred)}
      />
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex gap-2 mb-4">
        <Button
          variant={filter === "inbox" ? "default" : "outline"}
          onClick={() => setFilter("inbox")}
        >
          <Mail className="h-4 w-4 mr-2" />
          Inbox
        </Button>
        <Button
          variant={filter === "sent" ? "default" : "outline"}
          onClick={() => setFilter("sent")}
        >
          <MailOpen className="h-4 w-4 mr-2" />
          Sent
        </Button>
      </div>

      {emails.length === 0 ? (
        <Card>
          <CardContent className="p-8 text-center text-muted-foreground">
            No emails in {filter === "inbox" ? "inbox" : "sent"}
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {emails.map((email) => (
            <Card
              key={email.id}
              className="cursor-pointer hover:bg-accent transition-colors"
              onClick={() => {
                setSelectedEmail(email);
                if (!email.is_read && filter === "inbox") {
                  markAsRead(email.id);
                }
              }}
            >
              <CardContent className="p-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      {!email.is_read && filter === "inbox" && (
                        <Badge variant="default" className="text-xs">New</Badge>
                      )}
                      <span className="font-semibold truncate">
                        {filter === "inbox" ? email.sender : email.recipient}
                      </span>
                      {email.is_starred && (
                        <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                      )}
                    </div>
                    <p className="font-medium truncate text-foreground">{email.subject}</p>
                    <p className="text-sm text-muted-foreground truncate">{email.body}</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {formatDistanceToNow(new Date(email.created_at), { addSuffix: true })}
                    </p>
                  </div>
                  <div className="flex gap-1">
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleStar(email.id, email.is_starred);
                      }}
                    >
                      <Star className={`h-4 w-4 ${email.is_starred ? "fill-yellow-400 text-yellow-400" : ""}`} />
                    </Button>
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={(e) => {
                        e.stopPropagation();
                        deleteEmail(email.id);
                      }}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default EmailList;