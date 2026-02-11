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
    const [flash, setFlash] = useState(false);

    // 🎥 Démarrer la caméra
    useEffect(() => {
        navigator.mediaDevices
            .getUserMedia({ video: { facingMode: "environment" } })
            .then((mediaStream) => {
                setStream(mediaStream);

                if (videoRef.current) {
                    videoRef.current.srcObject = mediaStream;
                    videoRef.current.play();
                }
            })
            .catch((err) => console.error("Erreur caméra:", err));
    }, []);

    // 🔄 Boucle de scan automatique
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

                            // ⚡ Effet capture visuel
                            setFlash(true);
                            setTimeout(() => setFlash(false), 150);

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
                        }
                    },
                    onError: (errors) =>
                        console.error("Erreur OCR:", errors),
                }
            );
        }, 4000);

        return () => clearInterval(interval);
    }, [detected, stream]);

    return (
        <div style={{ position: "relative" }}>
            {/* Flash effet scan */}
            {flash && (
                <div
                    style={{
                        position: "absolute",
                        inset: 0,
                        background: "white",
                        opacity: 0.9,
                        zIndex: 20,
                        pointerEvents: "none",
                        animation: "flash 0.15s ease-out",
                    }}
                />
            )}

            <video
                ref={videoRef}
                autoPlay
                playsInline
                className="w-full h-auto"
            />

            <canvas
                ref={canvasRef}
                style={{ display: "none" }}
            />

            <style>
                {`
                    @keyframes flash {
                        from { opacity: 0.9; }
                        to { opacity: 0; }
                    }
                `}
            </style>
        </div>
    );
}
