import React, { useEffect } from 'react';
import { Head, Link, usePage } from '@inertiajs/react';
import Guest from '@/Layouts/GuestLayout';
import Footer from '@/Layouts/Footer';

const Welcome = () => {
    const { props } = usePage();
    const success = (props as any).flash?.success;

    useEffect(() => {
        if (success) alert(success);
    }, [success]);

    return (
        <Guest>
            <Head title="Accueil - Enregistrement des visiteurs INPHB" />

            <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex flex-col">


                <main className="flex-grow flex items-center justify-center container mx-auto px-4 py-12">
                    <div className="text-center max-w-4xl w-full">
                        {/* En-tête principale */}
                        <div className="mb-16">
                            <div className="inline-flex items-center justify-center w-24 h-24 bg-white rounded-2xl mb-8 shadow-lg border border-gray-100">
                                <span className="text-4xl">🏛️</span>
                            </div>
                            <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6 leading-tight">
                                Enregistrement des
                                <span className="block text-blue-600">Visiteurs INPHB</span>
                            </h1>
                            <p className="text-xl text-gray-600 max-w-2xl mx-auto leading-relaxed">
                                Système sécurisé d'enregistrement des visiteurs.
                                Scan de pièce d'identité et collecte des informations de visite.
                            </p>
                        </div>



                        {/* Actions principales */}
                        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-16">
                            <Link
                                href="/scanner"
                                className="group bg-blue-600 hover:bg-blue-700 text-white font-bold py-4 px-8 rounded-xl text-lg w-full sm:w-auto flex items-center justify-center space-x-3 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-105"
                            >
                                <span className="text-xl">📷</span>
                                <span>Scanner la pièce d'identité</span>
                            </Link>

                            <Link
                                href="/formulaire"
                                className="group bg-white hover:bg-gray-50 text-gray-800 font-semibold py-4 px-8 rounded-xl text-lg w-full sm:w-auto flex items-center justify-center space-x-3 transition-all duration-300 shadow-lg border border-gray-200 hover:border-gray-300"
                            >
                                <span className="text-xl">👤</span>
                                <span>Saisie manuelle</span>
                            </Link>
                        </div>



                        {/* Information complémentaire */}
                        <div className="mt-12 bg-blue-50 rounded-2xl p-6 border border-blue-200">
                            <div className="flex items-center justify-center space-x-4">
                                <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                                    <span className="text-blue-600 text-xl">ℹ️</span>
                                </div>
                                <div className="text-left">
                                    <h4 className="font-semibold text-gray-900">Information importante</h4>
                                    <p className="text-sm text-gray-600">
                                        Tous les visiteurs doivent être enregistrés avant d'accéder aux locaux de l'INPHB.
                                        Votre pièce d'identité est requise pour des raisons de sécurité.
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                </main>


            </div>
            <Footer></Footer>
        </Guest>

    );
};

export default Welcome;