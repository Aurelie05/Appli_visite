import React, { useEffect, useState } from 'react';
import { useForm, usePage, Head } from '@inertiajs/react';
import Guest from '@/Layouts/GuestLayout';
import Footer from '@/Layouts/Footer';
import { router } from '@inertiajs/react';

// AJOUT: Mettez à jour les props pour inclure ocr_debug
const Formulaire = ({
    photo_cni,
    error_ocr,
    ocr_debug,  // <- AJOUTEZ CE PROP
    nom: initialNom = '',
    prenom: initialPrenom = '',
    numero_cni: initialNumeroCni = ''
}: {
    photo_cni?: string;
    error_ocr?: string;
    ocr_debug?: string;  // <- AJOUTEZ CE PROP
    nom?: string;
    prenom?: string;
    numero_cni?: string;
}) => {
    const { props } = usePage();
    const { numero_badge, message_success } = props as any;

    const { data, setData, post, processing, errors, reset } = useForm({
        photo_cni: photo_cni || '',
        nom: initialNom,  // <- UTILISEZ les valeurs initiales
        prenom: initialPrenom,
        numero_cni: initialNumeroCni,
        telephone: '',
        personne_a_rencontrer: '',
        motif_visite: '',
    });

    const [badgeVisible, setBadgeVisible] = useState(false);

    // Mettez à jour les données quand les props changent (après upload photo)
    useEffect(() => {
        if (initialNom || initialPrenom || initialNumeroCni) {
            setData({
                ...data,
                nom: initialNom,
                prenom: initialPrenom,
                numero_cni: initialNumeroCni,
            });
        }
    }, [initialNom, initialPrenom, initialNumeroCni]);

    useEffect(() => {
        if (!window.Echo) {
            console.warn('Echo non disponible');
            return;
        }

        try {
            const channel = window.Echo.channel('visiteurs');
            channel.listen('.nouveau-visiteur', (data: any) => {
                console.log('Nouveau visiteur:', data);
            });

            return () => {
                if (channel && typeof channel.stopListening === 'function') {
                    channel.stopListening('.nouveau-visiteur');
                }
            };
        } catch (error) {
            console.warn('Erreur dans la gestion des channels Echo:', error);
        }
    }, []);

    const submit = (e: React.FormEvent) => {
        e.preventDefault();
        post('/visiteurs', {
            onSuccess: (page) => {
                setBadgeVisible(true);
                reset('nom', 'prenom', 'numero_cni', 'telephone', 'personne_a_rencontrer', 'motif_visite');
            },
        });
    };

    return (
        <Guest>
            <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-8">
                <Head title="Formulaire d'enregistrement - INPHB" />

                <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
                    {/* En-tête */}
                    <div className="text-center mb-8">
                        <h1 className="text-3xl font-bold text-gray-900 mb-2">
                            Formulaire d'enregistrement
                        </h1>
                        <p className="text-lg text-gray-600 max-w-2xl mx-auto">
                            Complétez les informations du visiteur pour finaliser l'enregistrement
                        </p>
                    </div>

                    {error_ocr && (
                        <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 rounded-lg mb-6 shadow-sm">
                            <div className="flex items-center">
                                <div className="flex-shrink-0">
                                    <span className="text-yellow-400 text-lg">⚠️</span>
                                </div>
                                <div className="ml-3">
                                    <p className="text-yellow-700 text-sm">{error_ocr}</p>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* AJOUT: Section de debug OCR */}
                    {ocr_debug && (
                        <div className="bg-gray-100 border border-gray-300 p-4 rounded-lg mb-6">
                            <h3 className="font-bold text-gray-700 mb-2">DEBUG OCR:</h3>
                            <pre className="text-xs text-gray-600 whitespace-pre-wrap overflow-auto max-h-40">
                                {ocr_debug}
                            </pre>
                        </div>
                    )}

                    <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
                        {/* En-tête de la carte */}
                        <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-6 py-4">
                            <h2 className="text-xl font-semibold text-white flex items-center">
                                <span className="mr-2">👤</span>
                                Informations du visiteur
                            </h2>
                        </div>

                        <div className="p-6 md:p-8">
                            {/* Photo CNI */}
                            {data.photo_cni && (
                                <div className="mb-8 text-center bg-gray-50 rounded-xl p-6 border-2 border-dashed border-gray-200">
                                    <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center justify-center">
                                        <span className="mr-2">📷</span>
                                        Photo de la pièce d'identité scannée
                                    </h3>
                                    <img
                                        src={`/storage/${data.photo_cni}`}
                                        alt="CNI capturée"
                                        className="mx-auto w-56 h-72 object-cover border-2 border-gray-300 rounded-xl shadow-md"
                                    />
                                </div>
                            )}

                            <form onSubmit={submit}>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8">
                                    {/* Nom */}
                                    <div className="space-y-2">
                                        <label className="block text-sm font-semibold text-gray-700 flex items-center">
                                            <span className="mr-2">🔤</span>
                                            Nom *
                                        </label>
                                        <input
                                            type="text"
                                            value={data.nom}
                                            onChange={e => setData('nom', e.target.value)}
                                            className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                                            placeholder="Entrez le nom"
                                            required
                                        />
                                        {errors.nom && (
                                            <p className="text-red-500 text-sm flex items-center mt-1">
                                                <span className="mr-1">❌</span>
                                                {errors.nom}
                                            </p>
                                        )}
                                    </div>

                                    {/* Prénom */}
                                    <div className="space-y-2">
                                        <label className="block text-sm font-semibold text-gray-700 flex items-center">
                                            <span className="mr-2">👤</span>
                                            Prénom *
                                        </label>
                                        <input
                                            type="text"
                                            value={data.prenom}
                                            onChange={e => setData('prenom', e.target.value)}
                                            className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                                            placeholder="Entrez le prénom"
                                            required
                                        />
                                        {errors.prenom && (
                                            <p className="text-red-500 text-sm flex items-center mt-1">
                                                <span className="mr-1">❌</span>
                                                {errors.prenom}
                                            </p>
                                        )}
                                    </div>

                                    {/* Numéro CNI */}
                                    <div className="space-y-2">
                                        <label className="block text-sm font-semibold text-gray-700 flex items-center">
                                            <span className="mr-2">🆔</span>
                                            Numéro CNI *
                                        </label>
                                        <input
                                            type="text"
                                            value={data.numero_cni}
                                            onChange={e => setData('numero_cni', e.target.value)}
                                            className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                                            placeholder="Ex: CI123456789"
                                            required
                                        />
                                        {errors.numero_cni && (
                                            <p className="text-red-500 text-sm flex items-center mt-1">
                                                <span className="mr-1">❌</span>
                                                {errors.numero_cni}
                                            </p>
                                        )}
                                    </div>

                                    {/* Téléphone */}
                                    <div className="space-y-2">
                                        <label className="block text-sm font-semibold text-gray-700 flex items-center">
                                            <span className="mr-2">📞</span>
                                            Téléphone *
                                        </label>
                                        <input
                                            type="tel"
                                            value={data.telephone}
                                            onChange={e => setData('telephone', e.target.value)}
                                            className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                                            placeholder="Ex: 07 12 34 56 78"
                                            required
                                            pattern="^[0-9]{10}$"
                                            title="Le numéro doit contenir exactement 10 chiffres."
                                        />
                                        {errors.telephone && (
                                            <p className="text-red-500 text-sm flex items-center mt-1">
                                                <span className="mr-1">❌</span>
                                                {errors.telephone}
                                            </p>
                                        )}
                                    </div>

                                    {/* Personne à voir */}
                                    <div className="md:col-span-2 space-y-2">
                                        <label className="block text-sm font-semibold text-gray-700 flex items-center">
                                            <span className="mr-2">🎯</span>
                                            Personne à rencontrer *
                                        </label>
                                        <input
                                            type="text"
                                            value={data.personne_a_rencontrer}
                                            onChange={e => setData('personne_a_rencontrer', e.target.value)}
                                            placeholder="Ex: Dr. Yao Vincent - Département Informatique"
                                            className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                                            required
                                        />
                                        {errors.personne_a_rencontrer && (
                                            <p className="text-red-500 text-sm flex items-center mt-1">
                                                <span className="mr-1">❌</span>
                                                {errors.personne_a_rencontrer}
                                            </p>
                                        )}
                                    </div>

                                    {/* Motif de visite */}
                                    <div className="md:col-span-2 space-y-2">
                                        <label className="block text-sm font-semibold text-gray-700 flex items-center">
                                            <span className="mr-2">🎯</span>
                                            Motif de la visite *
                                        </label>
                                        <select
                                            value={data.motif_visite}
                                            onChange={e => setData('motif_visite', e.target.value)}
                                            className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 appearance-none bg-white"
                                            required
                                        >
                                            <option value="" className="text-gray-400">-- Sélectionnez le motif de votre visite --</option>
                                            <option value="depot_dossier" className="text-gray-700">📄 Dépôt de dossier</option>
                                            <option value="entretien" className="text-gray-700">💼 Entretien</option>
                                            <option value="rendez_vous_pro" className="text-gray-700">🤝 Rendez-vous professionnel</option>
                                            <option value="visite" className="text-gray-700">🏫 Visite des locaux</option>
                                            <option value="reunion" className="text-gray-700">👥 Réunion</option>
                                            <option value="formation" className="text-gray-700">📚 Formation</option>
                                            <option value="autre" className="text-gray-700">📌 Autre</option>
                                        </select>
                                        {errors.motif_visite && (
                                            <p className="text-red-500 text-sm flex items-center mt-1">
                                                <span className="mr-1">❌</span>
                                                {errors.motif_visite}
                                            </p>
                                        )}
                                    </div>
                                </div>

                                {/* Bouton de soumission */}
                                <div className="mt-8 pt-6 border-t border-gray-200 flex justify-end">
                                    <button
                                        type="submit"
                                        disabled={processing}
                                        className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-semibold py-3 px-8 rounded-xl shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none disabled:hover:shadow-lg flex items-center space-x-2"
                                    >
                                        {processing ? (
                                            <>
                                                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                                <span>Enregistrement en cours...</span>
                                            </>
                                        ) : (
                                            <>
                                                <span>✅</span>
                                                <span>Enregistrer le visiteur</span>
                                            </>
                                        )}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>

                    {/* Modal du numéro de badge */}
                    {badgeVisible && (
                        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                            <div className="bg-white p-6 rounded-xl shadow-lg text-center max-w-sm w-full">
                                <h2 className="text-xl font-bold mb-4">{message_success}</h2>
                                <p className="mb-4">
                                    Numéro de badge : <strong>{numero_badge}</strong>
                                </p>
                                <button
                                    className="bg-blue-600 text-white px-4 py-2 rounded-xl hover:bg-blue-700"
                                    onClick={() => {
                                        setBadgeVisible(false);
                                        router.visit('/'); // redirection
                                    }}
                                >
                                    Fermer
                                </button>
                            </div>
                        </div>
                    )}

                    {/* Information sur la protection des données */}
                    <div className="mt-6 bg-blue-50 rounded-xl p-4 border border-blue-200">
                        <div className="flex items-start space-x-3">
                            <div className="flex-shrink-0 w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center mt-0.5">
                                <span className="text-blue-600 text-sm">🔒</span>
                            </div>
                            <div>
                                <h4 className="font-semibold text-blue-900 text-sm">Protection des données</h4>
                                <p className="text-blue-700 text-xs mt-1">
                                    Les informations collectées sont utilisées exclusivement pour la gestion des accès à l'INPHB
                                    et sont protégées conformément à la réglementation sur la protection des données personnelles.
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            <Footer />
        </Guest>
    );
};

export default Formulaire;