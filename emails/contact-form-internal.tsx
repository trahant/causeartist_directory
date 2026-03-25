import { Text } from "@react-email/components"
import { EmailWrapper, type EmailWrapperProps } from "~/emails/components/wrapper"

type EmailProps = EmailWrapperProps & {
  name: string
  fromEmail: string
  message: string
}

export const EmailContactFormInternal = ({ name, fromEmail, message, ...props }: EmailProps) => {
  return (
    <EmailWrapper
      {...props}
      preview={`New contact from ${name}`}
    >
      <Text className="text-base font-semibold">New contact form message</Text>
      <Text>
        <strong>Name:</strong> {name}
      </Text>
      <Text>
        <strong>Email:</strong> {fromEmail}
      </Text>
      <Text className="whitespace-pre-wrap">
        <strong>Message:</strong>
        {"\n\n"}
        {message}
      </Text>
    </EmailWrapper>
  )
}

EmailContactFormInternal.PreviewProps = {
  to: "team@example.com",
  name: "Jane Doe",
  fromEmail: "jane@example.com",
  message: "Hello, I would like to learn more about partnering with Causeartist.",
} satisfies EmailProps

export default EmailContactFormInternal
