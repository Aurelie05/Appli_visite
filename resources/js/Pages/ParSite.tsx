import React from 'react';
import Authenticated from '@/Layouts/AuthenticatedLayout';
// import { Inertia } from '@inertiajs/react';

type Visiteur = {
    id: number;
    nom: string;
    prenom: string;
    numero_cni: string;
    site: string;
};

type Props = {
    sud: Visiteur[];
    centre: Visiteur[];
    nord: Visiteur[];
};

export default function ParSite({ sud, centre, nord }: Props) {
    return (
        <Authenticated>
            <div className="p-8 space-y-8">
                <div>
                    <h2 className="text-xl font-bold mb-2">Visiteurs Sud</h2>
                    <ul>
                        {sud.map((v: any) => (
                            <li key={v.id}>
                                {v.nom} {v.prenom} - {v.numero_cni}
                            </li>
                        ))}
                    </ul>
                </div>

                <div>
                    <h2 className="text-xl font-bold mb-2">Visiteurs Centre</h2>
                    <ul>
                        {centre.map((v: any) => (
                            <li key={v.id}>
                                {v.nom} {v.prenom} - {v.numero_cni}
                            </li>
                        ))}
                    </ul>
                </div>

                <div>
                    <h2 className="text-xl font-bold mb-2">Visiteurs Nord</h2>
                    <ul>
                        {nord.map((v: any) => (
                            <li key={v.id}>
                                {v.nom} {v.prenom} - {v.numero_cni}
                            </li>
                        ))}
                    </ul>
                </div>
            </div>
        </Authenticated>
    );
}
