import React, { useRef, useEffect, useState } from "react";
import { router } from "@inertiajs/react";

type ScanResult = {
    nom?: string;
    prenom?: string;
    numero?: string;
};

export default function AutoScanCNI() {
    const videoRef = useRef<HTMLVideoElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [stream, setStream] = useState<MediaStream | null>(null);
    const [detected, setDetected] = useState(false);


    // Démarrer la caméra
    useEffect(() => {
        navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" } })
            .then((mediaStream) => {
                setStream(mediaStream);
                if (videoRef.current) {
                    videoRef.current.srcObject = mediaStream;
                    videoRef.current.play();
                }
            })
            .catch((err) => console.error("Erreur caméra:", err));
    }, []);

    // Boucle de scan automatique
    useEffect(() => {
        if (!videoRef.current || !canvasRef.current) return;

        const interval = setInterval(() => {
            if (detected) return;


            const video = videoRef.current;
            const canvas = canvasRef.current;
            if (!video || !canvas) return;

            const ctx = canvas.getContext("2d");
            if (!ctx) return;

            canvas.width = video.videoWidth;
            canvas.height = video.videoHeight;

            ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
            const base64 = canvas.toDataURL("image/png");

            router.post(
                "/scan-cni",
                { image: base64 },
                {
                    preserveScroll: true,
                    onSuccess: (page: any) => {
                        const data: ScanResult = page.props.data || {};

                        if (data.nom || data.prenom || data.numero) {
                            console.log("CNI détectée :", data);
                            setDetected(true);

                            stream?.getTracks().forEach((t) => t.stop());

                            router.visit("/formulaire", {
                                method: "get",
                                data: {
                                    nom: data.nom,
                                    prenom: data.prenom,
                                    numero_cni: data.numero,
                                },
                            });
                        } else {
                            console.log("Pas de CNI détectée pour cette image. Vérifier luminosité et position de la carte.");
                        }
                    },
                    onError: (errors) => console.error("Erreur OCR:", errors),
                }
            );


        }, 6000); // toutes les 4 secondes


        return () => clearInterval(interval);
    }, [detected, stream]);

    return (
        <div>
            <video ref={videoRef} autoPlay playsInline className="w-full h-auto" />
            <canvas ref={canvasRef} style={{ display: "none" }} />
        </div>
    );


}
