import React from 'react';
import { useForm } from '@inertiajs/react';
import Authenticated from "@/Layouts/AuthenticatedLayout";

export default function CreateAgent() {
    const { data, setData, post, processing, errors } = useForm({
        nom: '',
        prenom: '',
        site: '',
        email: '',
        password: '',
    });

    const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        console.log(data)
        post(route('agents.store'), {
            onSuccess: () => {
                // vider le formulaire
                setData({
                    nom: '',
                    prenom: '',
                    email: '',
                    password: '',
                    site: '',
                });

                alert('Agent créé avec succès !');
            },
        });

    };

    return (
        <Authenticated>
            <div className="max-w-md mx-auto mt-10 bg-white p-8 rounded-2xl shadow-lg">
                <h2 className="text-2xl font-semibold text-gray-800 mb-6">
                    Créer un agent
                </h2>

                <form onSubmit={handleSubmit} className="space-y-5">
                    {/* Nom */}
                    <div>
                        <label htmlFor="nom" className="block text-sm font-medium text-gray-700 mb-1">
                            Nom
                        </label>
                        <input
                            id="nom"
                            type="text"
                            value={data.nom}
                            onChange={(e) => setData('nom', e.target.value)}
                            placeholder="Ex: Kouassi"
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-200 focus:border-indigo-500 transition duration-200 ease-in-out"
                        />
                        {errors.nom && <p className="mt-1 text-sm text-red-500">{errors.nom}</p>}
                    </div>

                    {/* Prénom */}
                    <div>
                        <label htmlFor="prenom" className="block text-sm font-medium text-gray-700 mb-1">
                            Prénom
                        </label>
                        <input
                            id="prenom"
                            type="text"
                            value={data.prenom}
                            onChange={(e) => setData('prenom', e.target.value)}
                            placeholder="Ex: Jean"
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-200 focus:border-indigo-500 transition duration-200 ease-in-out"
                        />
                        {errors.prenom && <p className="mt-1 text-sm text-red-500">{errors.prenom}</p>}
                    </div>

                    {/* Email */}
                    <div>
                        <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                            Email
                        </label>
                        <input
                            id="email"
                            type="email"
                            value={data.email}
                            onChange={(e) => setData('email', e.target.value)}
                            placeholder="Ex: agent@exemple.com"
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-200 focus:border-indigo-500 transition duration-200 ease-in-out"
                        />
                        {errors.email && <p className="mt-1 text-sm text-red-500">{errors.email}</p>}
                    </div>

                    {/* Password */}
                    <div>
                        <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
                            Mot de passe
                        </label>
                        <input
                            id="password"
                            type="password"
                            value={data.password}
                            onChange={(e) => setData('password', e.target.value)}
                            placeholder="Ex: ********"
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-200 focus:border-indigo-500 transition duration-200 ease-in-out"
                        />
                        {errors.password && <p className="mt-1 text-sm text-red-500">{errors.password}</p>}
                    </div>

                    {/* Site */}
                    <div>
                        <label htmlFor="site" className="block text-sm font-medium text-gray-700 mb-1">
                            Site
                        </label>
                        <select
                            id="site"
                            value={data.site}
                            onChange={(e) => setData('site', e.target.value)}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-200 focus:border-indigo-500 transition duration-200 ease-in-out bg-white"
                        >
                            <option value="" disabled>Choisissez un site</option>
                            <option value="INPHB_SUD">INPHB_SUD</option>
                            <option value="INPHB_CENTRE">INPHB_CENTRE</option>
                            <option value="INPHB_NORD">INPHB_NORD</option>
                        </select>
                        {errors.site && <p className="mt-1 text-sm text-red-500">{errors.site}</p>}
                    </div>

                    {/* Bouton de soumission */}
                    <div className="pt-2">
                        <button
                            type="submit"
                            disabled={processing}
                            className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-medium py-2 px-4 rounded-lg transition duration-200 ease-in-out shadow-sm hover:shadow-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:opacity-50"
                        >
                            {processing ? 'Création...' : 'Créer l\'agent'}
                        </button>
                    </div>
                </form>
            </div>
        </Authenticated>
    );
}
