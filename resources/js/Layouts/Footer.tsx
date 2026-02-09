import React from "react"

export default function Footer() {


    return (


        <footer className="bg-white border-t border-gray-200 py-6 text-center">
            <div className="container mx-auto px-4">
                <p className="text-gray-600 text-sm">
                    © {new Date().getFullYear()} Institut National Polytechnique Félix Houphouët-Boigny -
                    Système de gestion des visiteurs. Tous droits réservés.
                </p>
            </div>
        </footer>

    )
}