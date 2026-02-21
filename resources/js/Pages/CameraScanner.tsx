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

    // Cadre agrandi (ajustez selon vos besoins)
    const FRAME_WIDTH = 650;
    const FRAME_HEIGHT = 400;

    // Fonction pour démarrer la caméra avec un deviceId donné
    const startCamera = async (deviceId: string) => {
        if (stream) {
            stream.getTracks().forEach(track => track.stop());
        }
        try {
            const mediaStream = await navigator.mediaDevices.getUserMedia({
                video: {
                    deviceId: { exact: deviceId },
                    width: { ideal: 1920 },
                    height: { ideal: 1080 },
                },
            });
            setStream(mediaStream);
            if (videoRef.current) {
                videoRef.current.srcObject = mediaStream;
                await videoRef.current.play();
            }
            setDebug("Caméra démarrée");
        } catch (err) {
            console.error("Erreur caméra:", err);
            setDebug("Erreur caméra: " + (err as Error).message);
        }
    };

    // Initialisation rapide de la caméra
    useEffect(() => {
        let mounted = true;

        const initCamera = async () => {
            try {
                // Étape 1 : essayer d'obtenir la liste des caméras sans flux temporaire
                let devices = await navigator.mediaDevices.enumerateDevices();
                let videoDevices = devices.filter(d => d.kind === "videoinput");

                // Si les labels sont vides (pas de permission), on demande un flux temporaire
                if (videoDevices.length === 0 || !videoDevices[0].label) {
                    const tempStream = await navigator.mediaDevices.getUserMedia({ video: true });
                    tempStream.getTracks().forEach(track => track.stop());
                    devices = await navigator.mediaDevices.enumerateDevices();
                    videoDevices = devices.filter(d => d.kind === "videoinput");
                }

                if (!mounted) return;

                // Chercher la caméra "Camera 2.0 facing back" ou une caméra arrière
                let selectedDeviceId = null;

                // 1. Recherche explicite du label contenant "2.0" et "back"
                const preferred = videoDevices.find(d =>
                    d.label.toLowerCase().includes("2.0") &&
                    d.label.toLowerCase().includes("back")
                );

                if (preferred) {
                    selectedDeviceId = preferred.deviceId;
                    setDebug(`Caméra préférée trouvée: ${preferred.label}`);
                } else {
                    // 2. Sinon, chercher une caméra avec "back" ou "environment"
                    const backCamera = videoDevices.find(d =>
                        d.label.toLowerCase().includes("back") ||
                        d.label.toLowerCase().includes("arrière") ||
                        d.label.toLowerCase().includes("environment")
                    );
                    if (backCamera) {
                        selectedDeviceId = backCamera.deviceId;
                        setDebug(`Caméra arrière trouvée: ${backCamera.label}`);
                    } else {
                        // 3. Dernier recours : la première caméra
                        selectedDeviceId = videoDevices[0]?.deviceId;
                        setDebug("Caméra par défaut");
                    }
                }

                if (selectedDeviceId) {
                    await startCamera(selectedDeviceId);
                } else {
                    setDebug("Aucune caméra disponible");
                }
            } catch (err) {
                if (!mounted) return;
                console.error("Erreur init caméra:", err);
                setDebug("Erreur init: " + (err as Error).message);
            }
        };

        initCamera();

        return () => {
            mounted = false;
            if (stream) {
                stream.getTracks().forEach(track => track.stop());
            }
        };
    }, []);

    // Dessiner le cadre de scan (avec les nouvelles dimensions)
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

                const x = (overlay.width - FRAME_WIDTH) / 2;
                const y = (overlay.height - FRAME_HEIGHT) / 2;

                // Assombrir l'extérieur du cadre
                ctx.fillStyle = "rgba(0,0,0,0.5)";
                ctx.fillRect(0, 0, overlay.width, overlay.height);
                ctx.clearRect(x, y, FRAME_WIDTH, FRAME_HEIGHT);

                // Dessiner le contour vert
                ctx.strokeStyle = "#00ff00";
                ctx.lineWidth = 4;
                ctx.strokeRect(x, y, FRAME_WIDTH, FRAME_HEIGHT);

                ctx.font = "20px Arial";
                ctx.fillStyle = "white";
                ctx.fillText("Placez la CNI dans le cadre", x, y - 10);
            }
            requestAnimationFrame(drawFrame);
        };

        const animationId = requestAnimationFrame(drawFrame);
        return () => cancelAnimationFrame(animationId);
    }, [videoRef.current, FRAME_WIDTH, FRAME_HEIGHT]);

    // Capture et envoi (adapté à la nouvelle taille)
    useEffect(() => {
        if (!videoRef.current || !canvasRef.current || !overlayRef.current) return;
        if (detected || !isScanning) return;

        const interval = setInterval(async () => {
            const video = videoRef.current;
            const canvas = canvasRef.current;
            const overlay = overlayRef.current;
            if (!video || !canvas || !overlay) return;

            if (video.videoWidth === 0 || video.videoHeight === 0) return;

            const ctx = canvas.getContext("2d");
            if (!ctx) return;

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

            // Amélioration du contraste
            const imageData = ctx.getImageData(0, 0, FRAME_WIDTH, FRAME_HEIGHT);
            const data = imageData.data;
            for (let i = 0; i < data.length; i += 4) {
                let r = data[i];
                let g = data[i + 1];
                let b = data[i + 2];
                let gray = 0.34 * r + 0.5 * g + 0.16 * b;
                gray = gray > 128 ? Math.min(255, gray + 40) : Math.max(0, gray - 40);
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
                            console.log("CNI détectée :", data);
                            setDetected(true);
                            setIsScanning(false);
                            setDebug("CNI détectée avec succès !");

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
    }, [detected, isScanning, stream, FRAME_WIDTH, FRAME_HEIGHT]);

    return (
        <div className="relative w-full max-w-3xl mx-auto">
            <video
                ref={videoRef}
                autoPlay
                playsInline
                className="w-full h-auto rounded-lg"
            />

            <canvas
                ref={overlayRef}
                className="absolute top-0 left-0 w-full h-full rounded-lg"
                style={{ pointerEvents: "none" }}
            />

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