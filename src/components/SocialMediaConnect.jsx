import React, { useState } from 'react';
import { useMixpostIntegration } from './SocialMedia/hooks/useMixpostIntegration';
import { useTranslation } from 'react-i18next';
import { useToast } from '../contexts/ToastContext';

// CSS-animaatio spin-efektille
const spinAnimation = `
  @keyframes spin {
    from { transform: rotate(0deg); }
    to { transform: rotate(360deg); }
  }
`;

const SocialMediaConnect = () => {
  const {
    socialAccounts,
    savedSocialAccounts,
    loading,
    error,
    connectSocialAccount,
    fetchSavedSocialAccounts,
    fetchSocialAccounts
  } = useMixpostIntegration();
  const { t } = useTranslation('common');
  const toast = useToast();

  const [connecting, setConnecting] = useState(false);
  const [connectionError, setConnectionError] = useState(null);

  const platforms = [
    { id: 'instagram', name: t('social.platforms.instagram'), icon: '📷' },
    { id: 'facebook', name: t('social.platforms.facebook'), icon: '📘' },
    { id: 'linkedin', name: 'LinkedIn', icon: '💼' }
  ];

  const handleConnectAccount = async (platform) => {
    try {
      setConnecting(platform);
      setConnectionError(null);
      console.log(`🔄 Yhdistetään ${platform}...`);
      
      await connectSocialAccount(platform);
      console.log(`✅ ${platform} yhdistetty onnistuneesti!`);
      
      // Päivitä tallennetut tilit
      await fetchSavedSocialAccounts();
      
    } catch (error) {
      console.error(`❌ Virhe yhdistettäessä ${platform}:`, error);
      setConnectionError(error.message);
      
      // Näytä käyttäjäystävällinen virheviesti
      const errorMessage = error.message.includes('Popup estetty') 
        ? t('settings.social.popupsBlocked')
        : error.message.includes('timeout') 
        ? t('settings.social.timeout')
        : t('settings.social.connectError', { platform, message: error.message });
      
      toast.error(errorMessage);
    } finally {
      setConnecting(null);
    }
  };

  const handleRefreshAccounts = async () => {
    try {
      console.log('🔄 Päivitetään sometilejä...');
      await fetchSocialAccounts();
      await fetchSavedSocialAccounts();
      console.log('✅ Sometilit päivitetty!');
    } catch (error) {
      console.error('❌ Virhe päivitettäessä tilejä:', error);
      toast.error(t('settings.social.alerts.refreshFailed'));
    }
  };

  // Käytä Mixpostista haettuja tilejä oletuksena, mutta näytä myös tallennetut tilit
  const connectedAccounts = socialAccounts.length > 0 ? socialAccounts : savedSocialAccounts;

  // Apufunktio profiilikuvan URL:n luomiseen
  const getProfileImageUrl = (account) => {
    // Jos tilillä on suora profile_image_url, käytä sitä
    if (account.profile_image_url) {
      return account.profile_image_url;
    }
    
    // Jos tilillä on image-kenttä, käytä sitä
    if (account.image) {
      return account.image;
    }
    
    // Jos tilillä on picture-kenttä, käytä sitä
    if (account.picture) {
      return account.picture;
    }
    
    return null;
  };

  // Apufunktio joka laskee päivät ja palauttaa varoitustiedot
  const getReauthorizationWarning = (account) => {
    if (!account) return null;

    // Määritä raja-arvot alustakohtaisesti
    const expirationDays = {
      'facebook': 90,
      'instagram': 90,
      'linkedin': 365
    };

    const maxDays = expirationDays[account.provider];
    if (!maxDays) return null;

    // Käytä last_synced_at jos saatavilla, muuten created_at
    const lastDate = account.last_synced_at || account.created_at;
    if (!lastDate) return null;

    const lastDateObj = new Date(lastDate);
    const now = new Date();
    const daysSince = Math.floor((now - lastDateObj) / (1000 * 60 * 60 * 24));
    const daysRemaining = maxDays - daysSince;

    // Jos ylitetty, palauta expired
    if (daysRemaining <= 0) {
      return {
        level: 'expired',
        daysRemaining: 0,
        daysSince: daysSince,
        maxDays: maxDays
      };
    }

    // Jos alle 7 päivää jäljellä, palauta warning
    if (daysRemaining <= 7) {
      return {
        level: 'warning',
        daysRemaining: daysRemaining,
        daysSince: daysSince,
        maxDays: maxDays
      };
    }

    // Jos alle 30 päivää jäljellä, palauta info
    if (daysRemaining <= 30) {
      return {
        level: 'info',
        daysRemaining: daysRemaining,
        daysSince: daysSince,
        maxDays: maxDays
      };
    }

    return null;
  };

  return (
    <div className="social-media-connect">
      <style>{spinAnimation}</style>
      
      <h2 className="social-media-title">
        {t('settings.social.title')}
      </h2>
      
      {error && (
        <div className="error-message">
          <strong>{t('settings.social.errorTitle')}</strong> {error}
          <br />
          <small>{t('settings.social.errorHelp')}</small>
        </div>
      )}

      {/* Yhdistetyt tilit - Mixpost-tyylinen kortti */}
      <div className="connected-accounts-section">
        <div className="accounts-header">
          <h3 className="accounts-title">
            {t('settings.social.connectedTitle', { count: connectedAccounts.length })}
          </h3>
          <button
            onClick={handleRefreshAccounts}
            disabled={loading}
            className="refresh-button"
          >
            {loading ? t('settings.social.refreshing') : t('settings.social.refresh')}
          </button>
        </div>
        
        <div className="accounts-grid">
          {/* Yhdistetyt tilit */}
          {connectedAccounts.map((account, index) => {
            const warning = getReauthorizationWarning(account);
            
            return (
              <div key={index} className={`account-card ${warning ? `warning-${warning.level}` : ''}`}>
                {/* Profiilikuva */}
                <div className={`profile-image ${account.provider}`}>
                  {getProfileImageUrl(account) ? (
                    <img 
                      src={getProfileImageUrl(account)} 
                      alt={account.name || account.username}
                      className="profile-img"
                      onError={(e) => {
                        e.target.style.display = 'none';
                        e.target.nextSibling.style.display = 'flex';
                      }}
                    />
                  ) : null}
                  <div className="profile-fallback">
                    {(account.name || account.username || '?').charAt(0).toUpperCase()}
                  </div>
                  {/* Platform-ikoni profiilikuvan alaosassa */}
                  <div className="profile-platform-icon">
                    {account.provider === 'instagram' ? '📷' :
                     account.provider === 'facebook' ? '📘' : 
                     account.provider === 'linkedin' ? '💼' : '?'}
                  </div>
                </div>

                {/* Tilin tiedot */}
                <div className="account-info">
                  <div className="account-name">
                    {account.name || account.username}
                  </div>
                  <div className="account-username">
                    @{account.username}
                  </div>
                  <div className="account-provider">
                    {account.provider === 'instagram' ? 'Instagram' :
                     account.provider === 'facebook' ? 'Facebook' : 
                     account.provider === 'linkedin' ? 'LinkedIn' : 
                     account.provider}
                  </div>
                  <div className="account-date">
                    {t('settings.social.addedAt', { date: account.created_at ? new Date(account.created_at).toLocaleDateString('fi-FI') : t('settings.social.unknownDate') })}
                  </div>
                  
                  {/* Varoitus */}
                  {warning && (
                    <div className={`account-warning warning-${warning.level}`}>
                      {warning.level === 'expired' && (
                        <div className="warning-content">
                          <span className="warning-icon">⚠️</span>
                          <span className="warning-text">
                            {t('settings.social.warning.expired', { 
                              days: warning.daysSince,
                              maxDays: warning.maxDays 
                            })}
                          </span>
                        </div>
                      )}
                      {warning.level === 'warning' && (
                        <div className="warning-content">
                          <span className="warning-icon">⚠️</span>
                          <span className="warning-text">
                            {t('settings.social.warning.soon', { 
                              days: warning.daysRemaining,
                              maxDays: warning.maxDays 
                            })}
                          </span>
                        </div>
                      )}
                      {warning.level === 'info' && (
                        <div className="warning-content">
                          <span className="warning-icon">ℹ️</span>
                          <span className="warning-text">
                            {t('settings.social.warning.reminder', { 
                              days: warning.daysRemaining,
                              maxDays: warning.maxDays 
                            })}
                          </span>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            );
          })}

          {/* "Lisää tili" -kortti */}
          <div className="add-account-card">
            <div className="add-account-content">
              <div className="add-icon">➕</div>
              <div className="add-text">{t('settings.social.addAccount')}</div>
            </div>
          </div>
        </div>
      </div>

      {/* Yhdistä tilit -osio */}
      <div className="connect-section">
        <h3 className="connect-title">
          {t('settings.social.connectTitle')}
        </h3>
        
        <div className="platforms-list">
          {platforms.map((platform) => {
            const isConnected = connectedAccounts.some(account => 
              account.provider === platform.id
            );
            const isConnecting = connecting === platform.id;
            
            return (
              <button
                key={platform.id}
                onClick={() => handleConnectAccount(platform.id)}
                disabled={isConnected || isConnecting}
                className={`platform-button ${isConnected ? 'connected' : ''} ${isConnecting ? 'connecting' : ''}`}
              >
                <div className="platform-icon-large">{platform.icon}</div>
                <div className="platform-info">
                  <div className="platform-name">
                    {platform.name}
                  </div>
                  <div className="platform-status">
                    {isConnected ? t('settings.social.status.connected') : isConnecting ? t('settings.social.status.connecting') : t('settings.social.status.cta')}
                  </div>
                </div>
                {isConnecting && (
                  <div className="loading-spinner"></div>
                )}
                {isConnected && (
                  <div className="connected-check">✅</div>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {connectionError && (
        <div className="connection-error">
          <strong>{t('settings.social.connectionErrorTitle')}</strong> {connectionError}
        </div>
      )}

      {/* Ohjeteksti */}
      <div className="help-text">
        <p><strong>{t('settings.social.helpTitle')}</strong></p>
        <ul>
          <li>{t('settings.social.help.0')}</li>
          <li>{t('settings.social.help.1')}</li>
          <li>{t('settings.social.help.2')}</li>
          <li>{t('settings.social.help.3')}</li>
        </ul>
      </div>
    </div>
  );
};

export default SocialMediaConnect; 