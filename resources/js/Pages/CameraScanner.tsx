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
    const [scanProgress, setScanProgress] = useState(0);

    // Dimensions du cadre de scan (format carte d'identité)
    const FRAME_WIDTH = 760;
    const FRAME_HEIGHT = 480; // Ratio carte d'identité

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

    // Animation de ligne de scan
    useEffect(() => {
        if (!isScanning || detected) return;

        const interval = setInterval(() => {
            setScanProgress(prev => (prev + 1) % 100);
        }, 20);

        return () => clearInterval(interval);
    }, [isScanning, detected]);

    // Dessiner le cadre sur l'overlay
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

                // Masque sombre autour du cadre
                ctx.fillStyle = "rgba(0, 0, 0, 0.7)";
                ctx.fillRect(0, 0, overlay.width, overlay.height);

                // Zone transparente pour la carte
                ctx.clearRect(x, y, FRAME_WIDTH, FRAME_HEIGHT);

                // Bordure extérieure lumineuse
                ctx.shadowColor = "#00d4ff";
                ctx.shadowBlur = 20;
                ctx.strokeStyle = "#00d4ff";
                ctx.lineWidth = 3;
                ctx.strokeRect(x, y, FRAME_WIDTH, FRAME_HEIGHT);
                ctx.shadowBlur = 0;

                // Coins décoratifs aux 4 angles
                const cornerSize = 40;
                ctx.strokeStyle = "#00d4ff";
                ctx.lineWidth = 6;
                ctx.lineCap = "round";

                // Coin supérieur gauche
                ctx.beginPath();
                ctx.moveTo(x + cornerSize, y);
                ctx.lineTo(x, y);
                ctx.lineTo(x, y + cornerSize);
                ctx.stroke();

                // Coin supérieur droit
                ctx.beginPath();
                ctx.moveTo(x + FRAME_WIDTH - cornerSize, y);
                ctx.lineTo(x + FRAME_WIDTH, y);
                ctx.lineTo(x + FRAME_WIDTH, y + cornerSize);
                ctx.stroke();

                // Coin inférieur gauche
                ctx.beginPath();
                ctx.moveTo(x, y + FRAME_HEIGHT - cornerSize);
                ctx.lineTo(x, y + FRAME_HEIGHT);
                ctx.lineTo(x + cornerSize, y + FRAME_HEIGHT);
                ctx.stroke();

                // Coin inférieur droit
                ctx.beginPath();
                ctx.moveTo(x + FRAME_WIDTH - cornerSize, y + FRAME_HEIGHT);
                ctx.lineTo(x + FRAME_WIDTH, y + FRAME_HEIGHT);
                ctx.lineTo(x + FRAME_WIDTH, y + FRAME_HEIGHT - cornerSize);
                ctx.stroke();

                // Ligne de scan animée
                if (isScanning && !detected) {
                    const scanY = y + (FRAME_HEIGHT * scanProgress) / 100;

                    // Dégradé de la ligne
                    const gradient = ctx.createLinearGradient(x, scanY - 10, x, scanY + 10);
                    gradient.addColorStop(0, "transparent");
                    gradient.addColorStop(0.5, "rgba(0, 212, 255, 0.8)");
                    gradient.addColorStop(1, "transparent");

                    ctx.fillStyle = gradient;
                    ctx.fillRect(x, scanY - 2, FRAME_WIDTH, 4);

                    // Lueur sur la ligne
                    ctx.shadowColor = "#00d4ff";
                    ctx.shadowBlur = 15;
                    ctx.fillStyle = "rgba(0, 212, 255, 0.5)";
                    ctx.fillRect(x, scanY - 1, FRAME_WIDTH, 2);
                    ctx.shadowBlur = 0;
                }

                // Texte d'instruction
                ctx.font = "bold 24px Arial, sans-serif";
                ctx.fillStyle = "white";
                ctx.textAlign = "center";
                ctx.shadowColor = "rgba(0, 0, 0, 0.8)";
                ctx.shadowBlur = 4;
                ctx.fillText("Placez votre carte d'identité ici", overlay.width / 2, y - 30);
                ctx.shadowBlur = 0;

                // Indicateur de statut
                if (isScanning && !detected) {
                    ctx.font = "16px Arial, sans-serif";
                    ctx.fillStyle = "#00d4ff";
                    ctx.fillText("🔍 Analyse en cours...", overlay.width / 2, y + FRAME_HEIGHT + 40);
                }
            }
            requestAnimationFrame(drawFrame);
        };

        const animationId = requestAnimationFrame(drawFrame);
        return () => cancelAnimationFrame(animationId);
    }, [videoRef.current, scanProgress, isScanning, detected]);

    // Capture et envoi
    useEffect(() => {
        if (!videoRef.current || !canvasRef.current || !overlayRef.current) return;
        if (detected || !isScanning) return;

        const interval = setInterval(async () => {
            const video = videoRef.current;
            const canvas = canvasRef.current;
            if (!video || !canvas) return;

            if (video.videoWidth === 0 || video.videoHeight === 0) return;

            const ctx = canvas.getContext("2d");
            if (!ctx) return;

            // Calculer les coordonnées du cadre
            const videoWidth = video.videoWidth;
            const videoHeight = video.videoHeight;
            const frameX = (videoWidth - FRAME_WIDTH) / 2;
            const frameY = (videoHeight - FRAME_HEIGHT) / 2;

            canvas.width = FRAME_WIDTH;
            canvas.height = FRAME_HEIGHT;

            // Extraire uniquement la zone du cadre
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

            // Amélioration du contraste pour l'OCR
            const imageData = ctx.getImageData(0, 0, FRAME_WIDTH, FRAME_HEIGHT);
            const data = imageData.data;

            for (let i = 0; i < data.length; i += 4) {
                let r = data[i];
                let g = data[i + 1];
                let b = data[i + 2];

                // Conversion en niveaux de gris avec pondération
                let gray = 0.299 * r + 0.587 * g + 0.114 * b;

                // Amélioration du contraste (histogram stretching)
                gray = ((gray - 50) / 155) * 255;
                gray = Math.max(0, Math.min(255, gray));

                // Augmentation de la netteté
                gray = gray > 128 ? Math.min(255, gray + 30) : Math.max(0, gray - 30);

                data[i] = gray;
                data[i + 1] = gray;
                data[i + 2] = gray;
            }
            ctx.putImageData(imageData, 0, 0);

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
                            setDetected(true);
                            setIsScanning(false);
                            setDebug("✅ CNI détectée avec succès !");

                            stream?.getTracks().forEach((t) => t.stop());

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
        }, 3000);

        return () => clearInterval(interval);
    }, [detected, isScanning, stream]);

    return (
        <div className="relative w-full max-w-4xl mx-auto bg-gray-900 rounded-2xl overflow-hidden shadow-2xl">
            {/* En-tête */}
            <div className="absolute top-0 left-0 right-0 z-20 bg-gradient-to-b from-black/80 to-transparent p-6">
                <h2 className="text-white text-2xl font-bold text-center">
                    Scanner votre Carte Nationale d'Identité
                </h2>
            </div>

            {/* Conteneur vidéo */}
            <div className="relative aspect-video bg-black">
                <video
                    ref={videoRef}
                    autoPlay
                    playsInline
                    muted
                    className="w-full h-full object-cover"
                />

                {/* Overlay pour le cadre de scan */}
                <canvas
                    ref={overlayRef}
                    className="absolute top-0 left-0 w-full h-full"
                    style={{ pointerEvents: "none" }}
                />

                {/* Canvas caché pour la capture */}
                <canvas ref={canvasRef} className="hidden" />

                {/* Indicateur de détection */}
                {detected && (
                    <div className="absolute inset-0 flex items-center justify-center bg-black/60 z-30">
                        <div className="bg-green-500 text-white px-8 py-4 rounded-full flex items-center gap-3 shadow-lg animate-pulse">
                            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                            <span className="text-xl font-bold">CNI Détectée !</span>
                        </div>
                    </div>
                )}
            </div>

            {/* Barre de statut en bas */}
            <div className="bg-gray-800 p-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className={`w-3 h-3 rounded-full ${isScanning ? 'bg-blue-500 animate-pulse' : detected ? 'bg-green-500' : 'bg-red-500'}`} />
                    <span className="text-gray-300 text-sm">
                        {debug || "En attente de la carte..."}
                    </span>
                </div>

                {/* Bouton d'annulation */}
                {isScanning && !detected && (
                    <button
                        onClick={() => {
                            setIsScanning(false);
                            stream?.getTracks().forEach((t) => t.stop());
                            router.visit("/formulaire");
                        }}
                        className="bg-red-600 hover:bg-red-700 text-white px-6 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2"
                    >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                        Annuler
                    </button>
                )}
            </div>

            {/* Instructions */}
            {!detected && isScanning && (
                <div className="bg-blue-900/30 border-t border-blue-800 p-4">
                    <div className="flex items-start gap-3 text-blue-200 text-sm">
                        <svg className="w-5 h-5 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <div>
                            <p className="font-medium mb-1">Conseils pour un bon scan :</p>
                            <ul className="list-disc list-inside space-y-1 text-blue-300">
                                <li>Assurez-vous d'avoir une bonne luminosité</li>
                                <li>Placez la carte bien à plat dans le cadre</li>
                                <li>Évitez les reflets sur la carte</li>
                            </ul>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}