import React, { useState } from 'react';
import { ShieldCheck, X, Lock, Server, UserCheck, Mail } from 'lucide-react';

export default function PrivacyFooter() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      {/* Pied de page discret */}
      <footer className="w-full border-t border-slate-200 bg-slate-50 py-4 px-4 mt-auto">
        <div className="max-w-5xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-slate-500">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            <span>
              <strong>BÂTIR+ PRO</strong> — Plateforme sécurisée de coordination de chantier
            </span>
          </div>
          <div className="flex items-center gap-4">
            <button
              onClick={() => setIsOpen(true)}
              className="text-slate-600 hover:text-blue-600 underline underline-offset-2 font-medium transition-colors cursor-pointer"
            >
              Politique de confidentialité & RGPD
            </button>
          </div>
        </div>
      </footer>

      {/* Fenêtre modale de consultation */}
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
          <div className="bg-white rounded-xl shadow-2xl border border-slate-200 max-w-3xl w-full max-h-[85vh] flex flex-col overflow-hidden">
            
            {/* En-tête de la modale */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-slate-50">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-blue-100 text-blue-700 rounded-lg">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-slate-900">
                    Politique de Confidentialité — Bâtir+ Pro
                  </h2>
                  <p className="text-xs text-slate-500">Version en vigueur : Novembre 2026</p>
                </div>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-200/70 rounded-lg transition-colors cursor-pointer"
                aria-label="Fermer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Contenu défilant */}
            <div className="p-6 overflow-y-auto space-y-6 text-sm text-slate-700 leading-relaxed">
              <p className="text-slate-600">
                La présente Politique de Confidentialité informe les utilisateurs de l'application web{' '}
                <strong>Bâtir+ Pro</strong> (ci-après « l'Application ») sur la manière dont leurs données
                personnelles sont collectées, traitées et protégées, conformément au Règlement (UE) 2016/679
                (Règlement Général sur la Protection des Données, dit « RGPD »).
              </p>

              <section className="space-y-2">
                <h3 className="text-base font-semibold text-slate-900">
                  1. Objet et Champ d'Application
                </h3>
                <p>
                  <strong>Bâtir+ Pro</strong> est une solution numérique indépendante dédiée à la coordination
                  opérationnelle sur le terrain, au suivi des plannings et à la gestion des réserves de chantier.
                  L'accès à l'Application est strictement réservé aux collaborateurs, compagnons et intervenants
                  habilités travaillant sur les chantiers concernés.
                </p>
              </section>

              <section className="space-y-2">
                <h3 className="text-base font-semibold text-slate-900">
                  2. Édition et Administration de l'Application
                </h3>
                <ul className="list-disc pl-5 space-y-1">
                  <li>
                    <strong>Éditeur et Administrateur :</strong> L'Application <strong>Bâtir+ Pro</strong> est une
                    plateforme indépendante conçue, développée et administrée pour l'optimisation de la gestion de chantier.
                  </li>
                  <li>
                    <strong>Contact dédié :</strong> Pour toute question relative au fonctionnement de l'Application ou
                    à la gestion des données, l'administrateur est joignable à l'adresse :{' '}
                    <a href="mailto:contact@batirpluspro.com" className="text-blue-600 font-medium hover:underline">
                      contact@batirpluspro.com
                    </a>.
                  </li>
                </ul>
              </section>

              <section className="space-y-2">
                <h3 className="text-base font-semibold text-slate-900">
                  3. Données Collectées et Finalités
                </h3>
                <p>
                  Conformément au principe de <strong>minimisation des données</strong>, seules les informations
                  strictement nécessaires à la bonne exécution des travaux et au suivi technique sont recueillies :
                </p>
                <ul className="list-disc pl-5 space-y-1">
                  <li>
                    <strong>Données d'identification :</strong> Nom, prénom et adresse électronique professionnelle
                    nécessaires à la création et à la sécurisation du compte d'accès.
                  </li>
                  <li>
                    <strong>Données opérationnelles de chantier :</strong> Numéros de lots ou d'appartements, noms de
                    famille des occupants concernés par les interventions, et signalements de réserves techniques.
                  </li>
                  <li>
                    <strong>Données sensibles :</strong> Aucune donnée à caractère personnel dite « sensible »
                    (origine, opinions, santé, etc.) n'est collectée ni sollicitée via l'Application.
                  </li>
                  <li>
                    <strong>Base légale :</strong> Le traitement repose sur l'intérêt légitime d'optimiser la
                    coordination opérationnelle des équipes et d'assurer un suivi rigoureux des chantiers.
                  </li>
                </ul>
              </section>

              <section className="space-y-2 bg-slate-50 p-4 rounded-lg border border-slate-200">
                <div className="flex items-center gap-2 text-slate-900 font-semibold text-base">
                  <Server className="w-4 h-4 text-blue-600" />
                  <h3>4. Hébergement et Sécurité des Infrastructures</h3>
                </div>
                <p>
                  Pour garantir la confidentialité, l'intégrité et la disponibilité des données,{' '}
                  <strong>Bâtir+ Pro</strong> s'appuie sur des prestataires Cloud répondant aux plus hauts standards :
                </p>
                <ul className="list-disc pl-5 space-y-1">
                  <li>
                    <strong>Hébergement de l'interface (Frontend) :</strong> Assuré par <strong>Vercel</strong>,
                    garantissant le chiffrement systématique des échanges (protocoles HTTPS / SSL).
                  </li>
                  <li>
                    <strong>Base de données et Authentification (Backend) :</strong> Assurés par{' '}
                    <strong>Google Firebase (Google Cloud)</strong>, offrant un chiffrement des données de pointe
                    (en transit et au repos) ainsi qu'un cloisonnement strict par code projet unique.
                  </li>
                </ul>
              </section>

              <section className="space-y-2">
                <div className="flex items-center gap-2 text-slate-900 font-semibold text-base">
                  <UserCheck className="w-4 h-4 text-emerald-600" />
                  <h3>5. Contrôle et Révocation des Accès</h3>
                </div>
                <ul className="list-disc pl-5 space-y-1">
                  <li>
                    <strong>Validation manuelle :</strong> Aucune inscription n'est validée automatiquement. Chaque
                    demande de compte fait l'objet d'une vérification manuelle par l'administrateur.
                  </li>
                  <li>
                    <strong>Gestion des départs :</strong> Dès qu'un compagnon ou un intervenant quitte un chantier, son
                    accès est immédiatement révoqué ou supprimé, lui retirant tout droit de consultation.
                  </li>
                  <li>
                    <strong>Sécurité des sessions :</strong> Il est demandé à chaque utilisateur de fermer sa session
                    après utilisation sur le terrain.
                  </li>
                </ul>
              </section>

              <section className="space-y-2">
                <h3 className="text-base font-semibold text-slate-900">
                  6. Destinataires et Conservation des Données
                </h3>
                <ul className="list-disc pl-5 space-y-1">
                  <li>
                    <strong>Usage strictement interne :</strong> Les données sont exclusivement accessibles aux
                    utilisateurs habilités rattachés au chantier concerné.
                  </li>
                  <li>
                    <strong>Absence d'exploitation commerciale :</strong> Aucune donnée personnelle n'est vendue,
                    louée, échangée ou transmise à des tiers ou à des agences publicitaires.
                  </li>
                  <li>
                    <strong>Durée de conservation :</strong> Les données sont conservées uniquement pendant la durée
                    nécessaire à l'exécution des travaux et à la levée des réserves, puis supprimées ou archivées de
                    manière sécurisée.
                  </li>
                </ul>
              </section>

              <section className="space-y-2">
                <div className="flex items-center gap-2 text-slate-900 font-semibold text-base">
                  <Lock className="w-4 h-4 text-slate-700" />
                  <h3>7. Vos Droits Informatique et Libertés</h3>
                </div>
                <p>
                  Conformément à la loi « Informatique et Libertés » et au RGPD, vous disposez d'un droit d'accès, de
                  rectification, de limitation, d'opposition et d'effacement concernant vos données personnelles.
                </p>
                <div className="flex items-center gap-2 pt-1 text-slate-800 font-medium">
                  <Mail className="w-4 h-4 text-blue-600" />
                  <span>
                    Exercer vos droits :{' '}
                    <a href="mailto:contact@batirpluspro.com" className="text-blue-600 hover:underline">
                      contact@batirpluspro.com
                    </a>
                  </span>
                </div>
                <p className="text-xs text-slate-500">
                  Vous disposez également du droit d'introduire une réclamation auprès de la CNIL (www.cnil.fr).
                </p>
              </section>
            </div>

            {/* Pied de la modale */}
            <div className="px-6 py-3 border-t border-slate-200 bg-slate-50 flex justify-end">
              <button
                onClick={() => setIsOpen(false)}
                className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white text-sm font-medium rounded-lg transition-colors cursor-pointer"
              >
                J'ai compris
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}