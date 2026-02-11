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
    const overlayRef = useRef<HTMLCanvasElement>(null);
    const [stream, setStream] = useState<MediaStream | null>(null);
    const [detected, setDetected] = useState(false);
    const [isScanning, setIsScanning] = useState(true);
    const [debug, setDebug] = useState<string>("");

    // Dimensions du cadre de scan
    const FRAME_WIDTH = 400;
    const FRAME_HEIGHT = 250;

    // Démarrer la caméra
    useEffect(() => {
        navigator.mediaDevices
            .getUserMedia({
                video: {
                    facingMode: "environment",
                    width: { ideal: 1920 },
                    height: { ideal: 1080 },
                },
            })
            .then((mediaStream) => {
                setStream(mediaStream);
                if (videoRef.current) {
                    videoRef.current.srcObject = mediaStream;
                    videoRef.current.play();
                }
            })
            .catch((err) => {
                console.error("Erreur caméra:", err);
                setDebug("Erreur caméra: " + err.message);
            });

        return () => {
            stream?.getTracks().forEach((t) => t.stop());
        };
    }, []);

    // Dessiner le cadre sur l'overlay quand la vidéo est prête
    useEffect(() => {
        const video = videoRef.current;
        const overlay = overlayRef.current;
        if (!video || !overlay) return;

        const drawFrame = () => {
            if (video.readyState === video.HAVE_ENOUGH_DATA) {
                overlay.width = video.videoWidth;
                overlay.height = video.videoHeight;

                const ctx = overlay.getContext("2d");
                if (!ctx) return;

                ctx.clearRect(0, 0, overlay.width, overlay.height);

                // Calculer la position centrée du cadre
                const x = (overlay.width - FRAME_WIDTH) / 2;
                const y = (overlay.height - FRAME_HEIGHT) / 2;

                // Dessiner un rectangle semi-transparent autour du cadre
                ctx.fillStyle = "rgba(0,0,0,0.5)";
                ctx.fillRect(0, 0, overlay.width, overlay.height);
                ctx.clearRect(x, y, FRAME_WIDTH, FRAME_HEIGHT);

                // Dessiner les coins du cadre
                ctx.strokeStyle = "#00ff00";
                ctx.lineWidth = 4;
                ctx.strokeRect(x, y, FRAME_WIDTH, FRAME_HEIGHT);

                // Ajouter un texte
                ctx.font = "20px Arial";
                ctx.fillStyle = "white";
                ctx.fillText("Placez la CNI dans le cadre", x, y - 10);
            }
            requestAnimationFrame(drawFrame);
        };

        const animationId = requestAnimationFrame(drawFrame);
        return () => cancelAnimationFrame(animationId);
    }, [videoRef.current]);

    // Capture et envoi
    useEffect(() => {
        if (!videoRef.current || !canvasRef.current || !overlayRef.current) return;
        if (detected || !isScanning) return;

        const interval = setInterval(async () => {
            const video = videoRef.current;
            const canvas = canvasRef.current;
            const overlay = overlayRef.current;
            if (!video || !canvas || !overlay) return;

            if (video.videoWidth === 0 || video.videoHeight === 0) return;

            // === AMÉLIORATION : Extraire uniquement la zone du cadre ===
            const ctx = canvas.getContext("2d");
            if (!ctx) return;

            // Calculer les coordonnées du cadre dans l'image vidéo
            const videoWidth = video.videoWidth;
            const videoHeight = video.videoHeight;
            const frameX = (videoWidth - FRAME_WIDTH) / 2;
            const frameY = (videoHeight - FRAME_HEIGHT) / 2;

            // Redimensionner le canvas de capture à la taille du cadre
            canvas.width = FRAME_WIDTH;
            canvas.height = FRAME_HEIGHT;

            // Dessiner uniquement la zone du cadre
            ctx.drawImage(
                video,
                frameX,
                frameY,
                FRAME_WIDTH,
                FRAME_HEIGHT,
                0,
                0,
                FRAME_WIDTH,
                FRAME_HEIGHT
            );

            // === AMÉLIORATION : Améliorer le contraste de l'image ===
            const imageData = ctx.getImageData(0, 0, FRAME_WIDTH, FRAME_HEIGHT);
            const data = imageData.data;

            // Augmenter le contraste (simple ajustement)
            for (let i = 0; i < data.length; i += 4) {
                let r = data[i];
                let g = data[i + 1];
                let b = data[i + 2];

                // Conversion en niveaux de gris
                let gray = 0.34 * r + 0.5 * g + 0.16 * b;
                // Augmenter le contraste
                gray = gray > 128 ? Math.min(255, gray + 40) : Math.max(0, gray - 40);

                data[i] = gray;
                data[i + 1] = gray;
                data[i + 2] = gray;
            }
            ctx.putImageData(imageData, 0, 0);

            // Convertir en base64 avec compression JPEG (meilleure qualité/poids)
            const base64 = canvas.toDataURL("image/jpeg", 0.9);

            setDebug(`Capture en cours... (${new Date().toLocaleTimeString()})`);

            router.post(
                "/scan-cni",
                { image: base64 },
                {
                    preserveScroll: true,
                    onSuccess: (page: any) => {
                        const data: ScanResult = page.props?.data || {};

                        if (data.nom || data.prenom || data.numero) {
                            console.log("CNI détectée :", data);
                            setDetected(true);
                            setIsScanning(false);
                            setDebug("CNI détectée avec succès !");

                            // Arrêter la caméra
                            stream?.getTracks().forEach((t) => t.stop());

                            // Redirection vers le formulaire avec les données
                            router.visit("/formulaire", {
                                method: "get",
                                data: {
                                    nom: data.nom || "",
                                    prenom: data.prenom || "",
                                    numero_cni: data.numero || "",
                                },
                            });
                        } else {
                            setDebug("Aucune CNI détectée. Ajustez le cadre.");
                        }
                    },
                    onError: (errors) => {
                        console.error("Erreur OCR:", errors);
                        setDebug("Erreur OCR: " + JSON.stringify(errors));
                    },
                }
            );
        }, 3000); // Capture toutes les 3 secondes

        return () => clearInterval(interval);
    }, [detected, isScanning, stream]);

    return (
        <div className="relative w-full max-w-3xl mx-auto">
            {/* Vidéo en arrière-plan */}
            <video
                ref={videoRef}
                autoPlay
                playsInline
                className="w-full h-auto rounded-lg"
            />

            {/* Overlay pour le cadre de scan */}
            <canvas
                ref={overlayRef}
                className="absolute top-0 left-0 w-full h-full rounded-lg"
                style={{ pointerEvents: "none" }}
            />

            {/* Canvas caché pour la capture */}
            <canvas ref={canvasRef} style={{ display: "none" }} />

            {/* Message de statut */}
            {!detected && isScanning && (
                <div className="absolute bottom-4 left-0 right-0 text-center">
                    <span className="bg-black bg-opacity-70 text-white px-4 py-2 rounded-full text-sm">
                        {debug || "Placez la carte dans le cadre vert..."}
                    </span>
                </div>
            )}

            {/* Bouton d'annulation */}
            {isScanning && !detected && (
                <button
                    onClick={() => {
                        setIsScanning(false);
                        stream?.getTracks().forEach((t) => t.stop());
                        router.visit("/formulaire");
                    }}
                    className="absolute top-4 right-4 bg-red-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-red-700"
                >
                    Annuler
                </button>
            )}
        </div>
    );
}