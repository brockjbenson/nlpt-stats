import { SubmitButton } from "@/components/submit-button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

function InvalidInvitation({
  message,
  title,
}: {
  message: string;
  title: string;
}) {
  return (
    <form className="w-full max-w-sm max-h-fit flex flex-col">
      <h1 className="text-2xl font-bold">Sign up</h1>
      <div className="flex flex-col gap-2 [&>input]:mb-3 mt-8">
        <Label htmlFor="email">Email</Label>
        <Input disabled name="email" placeholder="you@example.com" required />
        <Label htmlFor="password">Password</Label>
        <Input
          type="password"
          name="password"
          placeholder="Your password"
          minLength={6}
          disabled
          required
        />
        <SubmitButton
          className="mt-1 h-12 font-semibold"
          disabled
          pendingText="Signing up...">
          Sign up
        </SubmitButton>
        <Card className="mt-4 bg-red-600/5 border-red-600/70">
          <CardHeader>
            <CardTitle>{title}</CardTitle>
          </CardHeader>
          <CardContent className="text-sm">{message}</CardContent>
        </Card>
      </div>
    </form>
  );
}

export default InvalidInvitation;
