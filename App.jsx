import { useEffect } from 'react'
import { Routes, Route } from 'react-router-dom'
import { useVersionPolling } from './src/hooks/useVersionPolling'
import { SpeedInsights } from '@vercel/speed-insights/react'
import DashboardPage from './src/pages/DashboardPage'
import SignIn from './src/components/auth/SignIn'
import SignUp from './src/components/auth/SignUp'
import ForgotPassword from './src/components/auth/ForgotPassword'
import ResetPassword from './src/components/auth/ResetPassword'
import ProtectedRoute from './src/components/ProtectedRoute'
import AuthCallback from './src/components/auth/AuthCallback'
import { AuthProvider } from './src/contexts/AuthContext'
import { AutoLogoutProvider } from './src/contexts/AutoLogoutContext'
import { PostsProvider } from './src/contexts/PostsContext'
import { NotificationProvider } from './src/contexts/NotificationContext'
import { StrategyStatusProvider } from './src/contexts/StrategyStatusContext'
import { MonitoringProvider } from './src/contexts/MonitoringContext'
import { ToastProvider } from './src/contexts/ToastContext'
import Layout from './src/components/Layout'
import InactivityWarningModal from './src/components/InactivityWarningModal'
import VersionNotification from './src/components/VersionNotification'
import StrategyModalManager from './src/components/StrategyModalManager'
import OnboardingModal from './src/components/OnboardingModal'
import ToastContainer from './src/components/ToastContainer'
import ManagePostsPage from './src/pages/ManagePostsPage'
import AdminPage from './src/pages/AdminPage'
import ContentStrategyPage from './src/pages/ContentStrategyPage'
import AIChatPage from './src/pages/AIChatPage'
import DevPage from './src/pages/DevPage'
import HelpPage from './src/pages/HelpPage'
import CallPanel from './src/pages/CallPanel'
import SettingsPage from './src/pages/SettingsPage'
import BlogNewsletterPage from './src/pages/BlogNewsletterPage'
import AdminBlogPage from './src/pages/AdminBlogPage'
import AdminTestimonialsPage from './src/pages/AdminTestimonialsPage'
import MeetingNotesPage from './src/pages/MeetingNotesPage'
import CampaignsPage from './src/pages/CampaignsPage'
import CampaignCreatePage from './src/pages/CampaignCreatePage'
import CampaignDetailPage from './src/pages/CampaignDetailPage'
import AccountManagerPage from './src/pages/AccountManagerPage'
import AccountDetailsPage from './src/pages/AccountDetailsPage'
import OrganizationMembersPage from './src/pages/OrganizationMembersPage'
import LeadMagnetPage from './src/pages/LeadMagnetPage'
import VastaajaPage from './src/pages/VastaajaPage'
import LeadScrapingPage from './src/pages/LeadScrapingPage'
import TestN8NPage from './src/pages/TestN8NPage'
import MediaMonitoringPage from './src/pages/MediaMonitoringPage'
import MonitoringCreatePostPage from './src/pages/MonitoringCreatePostPage'

// ConditionalChatbotWidget komponentti - ei tarvita enää
function ConditionalChatbotWidget() {
  return null
}

export default function App() {
  useVersionPolling()

  console.log('🔵🔵🔵 App.jsx: RENDERING!', {
    timestamp: new Date().toISOString(),
    stack: new Error().stack.split('\n')[2]
  })

  // Debug: Kuuntele välilehden vaihtoa
  useEffect(() => {
    const handleVisibilityChange = () => {
      console.log('👀 App.jsx: Visibility changed:', document.visibilityState)
    }
    document.addEventListener('visibilitychange', handleVisibilityChange)
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange)
  }, [])

  return (
    <AuthProvider>
      <AutoLogoutProvider>
        <ToastProvider>
          <ToastContainer />
          <OnboardingModal />
          <PostsProvider>
            <NotificationProvider>
              <MonitoringProvider>
                <StrategyStatusProvider>
                  <Routes>
                    {/* Kirjautumisreitit */}
                    <Route path="/" element={<SignIn />} />
                    <Route path="/signin" element={<SignIn />} />
                    <Route path="/signup" element={<SignUp />} />
                    <Route path="/forgot-password" element={<ForgotPassword />} />
                    <Route path="/reset-password" element={<ResetPassword />} />
                    <Route path="/auth/callback" element={<AuthCallback />} />

                    {/* Julkinen lead magnet -sivu */}
                    <Route path="/leadmagnet/:token" element={<LeadMagnetPage />} />

                    {/* Suojatut reitit yhteisellä layoutilla */}
                    <Route element={<ProtectedRoute><Layout /></ProtectedRoute>}>
                      <Route path="/dashboard" element={<DashboardPage />} />
                      <Route path="/campaigns" element={<CampaignsPage />} />
                      <Route path="/campaigns/create" element={<CampaignCreatePage />} />
                      <Route path="/campaigns/:id" element={<CampaignDetailPage />} />
                      <Route path="/posts" element={<ManagePostsPage />} />
                      <Route path="/blog-newsletter" element={<BlogNewsletterPage />} />
                      <Route path="/strategy" element={<ContentStrategyPage />} />
                      <Route path="/ai-chat" element={<AIChatPage />} />
                      <Route path="/help" element={<HelpPage />} />
                      <Route path="/test-n8n" element={<TestN8NPage />} />
                      <Route path="/calls" element={<CallPanel />} />
                      <Route path="/settings" element={<SettingsPage />} />
                      <Route path="/organization-members" element={<OrganizationMembersPage />} />
                      <Route path="/meeting-notes" element={<MeetingNotesPage />} />
                      <Route path="/vastaaja" element={<VastaajaPage />} />
                      <Route path="/lead-scraping" element={<LeadScrapingPage />} />
                      <Route path="/monitoring" element={
                        <ProtectedRoute requiredFeatures={['Media Monitoring']}>
                          <MediaMonitoringPage />
                        </ProtectedRoute>
                      } />
                      <Route path="/monitoring/create" element={
                        <ProtectedRoute requiredFeatures={['Media Monitoring']}>
                          <MonitoringCreatePostPage />
                        </ProtectedRoute>
                      } />
                    </Route>

                    {/* Superadmin-reitit (vaativat superadmin-roolin) */}
                    <Route element={<ProtectedRoute requiredRole="superadmin"><Layout /></ProtectedRoute>}>
                      <Route path="/admin" element={<AdminPage />} />
                      <Route path="/dev" element={<DevPage />} />
                      <Route path="/admin-blog" element={<AdminBlogPage />} />
                      <Route path="/admin-testimonials" element={<AdminTestimonialsPage />} />
                    </Route>

                    {/* Moderator-reitit (vaativat moderator-roolin tai ylemmän) */}
                    <Route element={<ProtectedRoute requiredRole="moderator"><Layout /></ProtectedRoute>}>
                      <Route path="/account-manager" element={<AccountManagerPage />} />
                      <Route path="/account-manager/:id" element={<AccountDetailsPage />} />
                    </Route>
                  </Routes>
                  <VersionNotification />
                  <StrategyModalManager />
                </StrategyStatusProvider>
              </MonitoringProvider>
            </NotificationProvider>
          </PostsProvider>
          <ConditionalChatbotWidget />
          <InactivityWarningModal />
          <SpeedInsights />
        </ToastProvider>
      </AutoLogoutProvider>
    </AuthProvider>
  )
} 