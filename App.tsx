
import React, { useState, useEffect } from 'react';
import { AppView } from './types';
import { AuthProvider, useAuth } from './src/contexts/AuthContext';
import LandingView from './views/LandingView';
import AuthView from './views/AuthView';
import SignupView from './views/SignupView';
import OnboardingView from './views/OnboardingView';
import DashboardView from './views/DashboardView';
import ItemDetailView from './views/ItemDetailView';
import HistoryView from './views/HistoryView';
import AddItemView from './views/AddItemView';
import VotingDetailView from './views/VotingDetailView';
import SettingsView from './views/SettingsView';
import CreateGroupView from './views/CreateGroupView';

const AppContent: React.FC = () => {
  const { user, loading } = useAuth();
  const [currentView, setCurrentView] = useState<AppView>(AppView.LANDING);
  const [selectedProductId, setSelectedProductId] = useState<string | null>(null);
  const [dashboardTab, setDashboardTab] = useState<'personal' | 'shared'>('personal');
  const [authDefaultLogin, setAuthDefaultLogin] = useState(false);

  // 根據認證狀態自動導航
  useEffect(() => {
    if (!loading) {
      if (user) {
        // 如果已登入，且在非登入後頁面，則導航至儀表板
        if ([AppView.LANDING, AppView.AUTH, AppView.SIGNUP].includes(currentView)) {
          setCurrentView(AppView.DASHBOARD);
        }
      } else {
        // 如果未登入，且在需要登入的頁面，則導航至認證頁
        if ([
          AppView.DASHBOARD,
          AppView.DETAIL,
          AppView.HISTORY,
          AppView.ADD_ITEM,
          AppView.SETTINGS,
          AppView.VOTING_DETAIL,
          AppView.CREATE_GROUP,
          AppView.EDIT_GROUP,
          AppView.SHARED_LIST
        ].includes(currentView)) {
          setCurrentView(AppView.AUTH);
        }
      }
    }
  }, [user, loading, currentView]);

  const navigateTo = (view: AppView, productId?: string) => {
    if (productId) setSelectedProductId(productId);
    if (view === AppView.DASHBOARD) setDashboardTab('personal');
    // 如果不是導向 Auth，重置登入狀態
    if (view !== AppView.AUTH) setAuthDefaultLogin(false);
    setCurrentView(view);
    window.scrollTo(0, 0);
  };

  const navigateToAuth = (showLogin: boolean) => {
    setAuthDefaultLogin(showLogin);
    setCurrentView(AppView.AUTH);
    window.scrollTo(0, 0);
  };

  const navigateToDashboardShared = () => {
    setDashboardTab('shared');
    setCurrentView(AppView.DASHBOARD);
    window.scrollTo(0, 0);
  };

  // 顯示載入狀態
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#fdfbf7] dark:bg-background-dark">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
          <p className="text-[#8b7361] font-bold">載入中...</p>
        </div>
      </div>
    );
  }

  const renderView = () => {
    switch (currentView) {
      case AppView.LANDING:
        return (
          <LandingView
            onNext={() => navigateToAuth(false)}
            onLogin={() => navigateToAuth(true)}
          />
        );
      case AppView.AUTH:
        return (
          <AuthView
            initialShowLogin={authDefaultLogin}
            onEmailClick={() => navigateTo(AppView.SIGNUP)}
            onLogin={() => navigateTo(AppView.DASHBOARD)}
          />
        );
      case AppView.SIGNUP:
        return <SignupView onBack={() => navigateTo(AppView.AUTH)} onSignup={() => navigateTo(AppView.ONBOARDING)} />;
      case AppView.ONBOARDING:
        return <OnboardingView onComplete={() => navigateTo(AppView.DASHBOARD)} />;
      case AppView.DASHBOARD:
        return <DashboardView initialTab={dashboardTab} onSelectProduct={(id) => navigateTo(AppView.DETAIL, id)} onNavigate={navigateTo} />;
      case AppView.DETAIL:
        return <ItemDetailView productId={selectedProductId} onBack={() => navigateTo(AppView.DASHBOARD)} onSharedList={navigateToDashboardShared} />;
      case AppView.VOTING_DETAIL:
        return <VotingDetailView onBack={navigateToDashboardShared} />;
      case AppView.HISTORY:
        return <HistoryView onBack={() => navigateTo(AppView.DASHBOARD)} />;
      case AppView.ADD_ITEM:
        return <AddItemView onBack={() => setCurrentView(AppView.DASHBOARD)} onSave={() => setCurrentView(AppView.DASHBOARD)} />;
      case AppView.SETTINGS:
        return <SettingsView onBack={() => navigateTo(AppView.DASHBOARD)} onLogout={() => navigateTo(AppView.AUTH)} />;
      case AppView.CREATE_GROUP:
        return <CreateGroupView onBack={navigateToDashboardShared} onComplete={navigateToDashboardShared} />;
      case AppView.EDIT_GROUP:
        return <CreateGroupView isEdit onBack={navigateToDashboardShared} onComplete={navigateToDashboardShared} />;
      default:
        return (
          <LandingView
            onNext={() => navigateToAuth(false)}
            onLogin={() => navigateToAuth(true)}
          />
        );
    }
  };

  return (
    <div className="min-h-screen font-sans">
      {renderView()}
    </div>
  );
};

const App: React.FC = () => {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
};

export default App;
