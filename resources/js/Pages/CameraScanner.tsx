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
    const containerRef = useRef<HTMLDivElement>(null);
    const [stream, setStream] = useState<MediaStream | null>(null);
    const [detected, setDetected] = useState(false);
    const [isScanning, setIsScanning] = useState(true);
    const [debug, setDebug] = useState<string>("");
    const [scanProgress, setScanProgress] = useState(0);
    const [dimensions, setDimensions] = useState({ width: 0, height: 0 });

    // Dimensions du cadre de scan (format carte d'identité) - AGRANDI
    const FRAME_WIDTH = 1750;  // Augmenté de 760
    const FRAME_HEIGHT = 850;  // Augmenté de 480

    // Mettre à jour les dimensions de l'écran
    useEffect(() => {
        const updateDimensions = () => {
            setDimensions({
                width: window.innerWidth,
                height: window.innerHeight
            });
        };

        updateDimensions();
        window.addEventListener('resize', updateDimensions);
        return () => window.removeEventListener('resize', updateDimensions);
    }, []);

    // Démarrer la caméra
    useEffect(() => {
        navigator.mediaDevices
            .getUserMedia({
                video: {
                    facingMode: "environment",
                    width: { ideal: 4096 },
                    height: { ideal: 2160 },
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
        }, 15);

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
                ctx.fillStyle = "rgba(0, 0, 0, 0.75)";
                ctx.fillRect(0, 0, overlay.width, overlay.height);

                // Zone transparente pour la carte
                ctx.clearRect(x, y, FRAME_WIDTH, FRAME_HEIGHT);

                // Bordure extérieure lumineuse
                ctx.shadowColor = "#00d4ff";
                ctx.shadowBlur = 30;
                ctx.strokeStyle = "#00d4ff";
                ctx.lineWidth = 4;
                ctx.strokeRect(x, y, FRAME_WIDTH, FRAME_HEIGHT);
                ctx.shadowBlur = 0;

                // Coins décoratifs aux 4 angles - AGRANDIS
                const cornerSize = 60;
                ctx.strokeStyle = "#00d4ff";
                ctx.lineWidth = 8;
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
                    const gradient = ctx.createLinearGradient(x, scanY - 15, x, scanY + 15);
                    gradient.addColorStop(0, "transparent");
                    gradient.addColorStop(0.5, "rgba(0, 212, 255, 0.9)");
                    gradient.addColorStop(1, "transparent");

                    ctx.fillStyle = gradient;
                    ctx.fillRect(x, scanY - 3, FRAME_WIDTH, 6);

                    // Lueur sur la ligne
                    ctx.shadowColor = "#00d4ff";
                    ctx.shadowBlur = 25;
                    ctx.fillStyle = "rgba(0, 212, 255, 0.6)";
                    ctx.fillRect(x, scanY - 2, FRAME_WIDTH, 4);
                    ctx.shadowBlur = 0;
                }

                // Texte d'instruction centré en haut
                ctx.font = "bold 36px Arial, sans-serif";
                ctx.fillStyle = "white";
                ctx.textAlign = "center";
                ctx.shadowColor = "rgba(0, 0, 0, 0.9)";
                ctx.shadowBlur = 8;
                ctx.fillText("Placez votre carte d'identité dans le cadre", overlay.width / 2, y - 50);
                ctx.shadowBlur = 0;

                // Indicateur de scan
                if (isScanning && !detected) {
                    ctx.font = "24px Arial, sans-serif";
                    ctx.fillStyle = "#00d4ff";
                    ctx.fillText("🔍 Analyse en cours...", overlay.width / 2, y + FRAME_HEIGHT + 60);
                }
            }
            requestAnimationFrame(drawFrame);
        };

        const animationId = requestAnimationFrame(drawFrame);
        return () => cancelAnimationFrame(animationId);
    }, [videoRef.current, scanProgress, isScanning, detected]);

    // Capture et envoi
    useEffect(() => {
        if (!videoRef.current || !canvasRef.current) return;
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

                let gray = 0.299 * r + 0.587 * g + 0.114 * b;
                gray = ((gray - 50) / 155) * 255;
                gray = Math.max(0, Math.min(255, gray));
                gray = gray > 128 ? Math.min(255, gray + 30) : Math.max(0, gray - 30);

                data[i] = gray;
                data[i + 1] = gray;
                data[i + 2] = gray;
            }
            ctx.putImageData(imageData, 0, 0);

            const base64 = canvas.toDataURL("image/jpeg", 0.9);

            setDebug(`Capture...`);

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

                            stream?.getTracks().forEach((t) => t.stop());

                            router.visit("/formulaire", {
                                method: "get",
                                data: {
                                    nom: data.nom || "",
                                    prenom: data.prenom || "",
                                    numero_cni: data.numero || "",
                                },
                            });
                        }
                    },
                    onError: (errors) => {
                        console.error("Erreur OCR:", errors);
                    },
                }
            );
        }, 3000);

        return () => clearInterval(interval);
    }, [detected, isScanning, stream]);

    return (
        <div
            ref={containerRef}
            className="fixed inset-0 bg-black overflow-hidden"
        >
            {/* Vidéo plein écran */}
            <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className="absolute inset-0 w-full h-full object-cover"
            />

            {/* Overlay pour le cadre de scan */}
            <canvas
                ref={overlayRef}
                className="absolute inset-0 w-full h-full"
                style={{ pointerEvents: "none" }}
            />

            {/* Canvas caché pour la capture */}
            <canvas ref={canvasRef} className="hidden" />

            {/* Bouton d'annulation en haut à droite */}
            {isScanning && !detected && (
                <button
                    onClick={() => {
                        setIsScanning(false);
                        stream?.getTracks().forEach((t) => t.stop());
                        router.visit("/formulaire");
                    }}
                    className="absolute top-6 right-6 z-50 bg-red-600/90 hover:bg-red-700 text-white px-6 py-3 rounded-full text-lg font-medium transition-all backdrop-blur-sm shadow-lg flex items-center gap-2"
                >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                    Annuler
                </button>
            )}

            {/* Message de succès */}
            {detected && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/70 z-40">
                    <div className="bg-green-500 text-white px-12 py-6 rounded-2xl flex items-center gap-4 shadow-2xl animate-pulse">
                        <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                        </svg>
                        <span className="text-3xl font-bold">CNI Détectée !</span>
                    </div>
                </div>
            )}
        </div>
    );
}