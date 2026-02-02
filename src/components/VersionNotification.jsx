import React from 'react'
import { createPortal } from 'react-dom'
import Button from './Button'
import { useNotifications } from '../contexts/NotificationContext'

const VersionNotification = () => {
  const { showVersionNotification, markVersionAsSeen } = useNotifications()

  if (!showVersionNotification) return null

  const currentVersion = import.meta.env.REACT_APP_VERSION || '1.67.0'

  return createPortal(
    <div className="version-notification-overlay fixed inset-0 bg-black/50 flex items-center justify-center z-[9999]">
      <div className="version-notification-modal bg-white rounded-xl p-6 max-w-[500px] w-[90%] shadow-xl relative">
        {/* Sulje-nappi */}
        <button
          onClick={markVersionAsSeen}
          className="absolute top-3 right-3 bg-transparent border-none text-xl cursor-pointer text-gray-500 p-1"
        >
          ✕
        </button>

        {/* Sisältö */}
        <div className="pr-8">
          <div className="flex items-center mb-4">
            <div className="w-10 h-10 bg-emerald-500 rounded-full flex items-center justify-center mr-3">
              <span className="text-white text-xl font-bold">R</span>
            </div>
            <h2 className="m-0 text-2xl font-bold text-gray-900">
              Hei! Rascal AI on saanut uuden päivityksen! 🎉
            </h2>
          </div>

          <div className="mb-5">
            <p className="m-0 mb-3 text-base text-gray-700 leading-normal">
              Tervetuloa takaisin! Olemme kehittäneet Rascal AI:ta eteenpäin ja nyt on valmis versio <strong>v{currentVersion}</strong>
            </p>

            <div className="bg-gray-100 p-4 rounded-lg mb-4">
              <h3 className="m-0 mb-2 text-lg font-semibold text-gray-900">
                Mitä uutta tässä versiossa:
              </h3>
              <ul className="m-0 pl-5 text-gray-700 leading-relaxed">
                <li><strong>Strategian vahvistus:</strong> Nyt voit hyväksyä strategiat suoraan sovelluksesta! Ei tarvitse enää käydä erikseen tarkistamassa.</li>
                <li><strong>Selkeä status:</strong> Näet heti mitkä strategiat on hyväksytty ja mitkä odottaa vielä vahvistusta.</li>
                <li><strong>Automaattinen synkronointi:</strong> Sometilit yhdistyvät nyt automaattisesti - ei tarvitse tehdä mitään erikseen!</li>
                <li><strong>Parempi käyttökokemus:</strong> Sovellus muistaa paremmin mitä olet tehnyt ja näyttää vahvistuksia.</li>
                <li><strong>Nopeampi työskentely:</strong> Kaikki tärkeimmät toiminnot löytyvät nyt helpommin.</li>
              </ul>
            </div>

            <p className="m-0 text-sm text-gray-500 italic">
              Kiitos kun olet mukana! Ilman sinua tämä ei olisi mahdollista 🙏
            </p>
          </div>

          <div className="flex justify-end gap-3">
            <Button
              variant="secondary"
              onClick={markVersionAsSeen}
            >
              Joo, jatketaan!
            </Button>
            <Button
              variant="primary"
              onClick={() => {
                window.location.reload()
                markVersionAsSeen()
              }}
            >
              Päivitä sivu
            </Button>
          </div>
        </div>
      </div>
    </div>,
    document.body
  )
}

export default VersionNotification
