import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getConversationsListAction } from '@/app/actions/messages'
import { TeamsChatWorkspace } from '@/components/chat/TeamsChatWorkspace'

export const dynamic = 'force-dynamic'

export default async function ChatPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('id, full_name, role, avatar_url')
    .eq('id', user.id)
    .single()

  const conversations = await getConversationsListAction()

  return (
    <main className="h-screen w-screen overflow-hidden flex flex-col bg-[var(--md-sys-color-surface-container-lowest)]">
      <TeamsChatWorkspace
        currentUserId={user.id}
        currentUserName={profile?.full_name || user.email?.split('@')[0] || 'Team Member'}
        currentUserRole={profile?.role || 'member'}
        currentUserAvatar={profile?.avatar_url}
        initialConversations={conversations}
        showMiniSidebar={true}
      />
    </main>
  )
}
