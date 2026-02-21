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

    // États pour la sélection de caméra
    const [devices, setDevices] = useState<MediaDeviceInfo[]>([]);
    const [selectedDeviceId, setSelectedDeviceId] = useState<string>("");

    const FRAME_WIDTH = 400;
    const FRAME_HEIGHT = 250;

    // Fonction pour démarrer la caméra avec un deviceId donné
    const startCamera = async (deviceId: string) => {
        // Arrêter l'ancien flux s'il existe
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
                videoRef.current.play();
            }
            // Trouver le nom de la caméra pour le debug
            const device = devices.find(d => d.deviceId === deviceId);
            setDebug(`Caméra active : ${device?.label || "inconnue"}`);
        } catch (err) {
            console.error("Erreur caméra:", err);
            setDebug("Erreur caméra: " + (err as Error).message);
        }
    };

    // Énumérer les caméras au montage
    useEffect(() => {
        const initCameras = async () => {
            try {
                // Demander une permission temporaire pour obtenir la liste
                const tempStream = await navigator.mediaDevices.getUserMedia({ video: true });
                tempStream.getTracks().forEach(track => track.stop());

                const allDevices = await navigator.mediaDevices.enumerateDevices();
                const videoDevices = allDevices.filter(device => device.kind === "videoinput");
                setDevices(videoDevices);

                // Sélectionner par défaut la première caméra (souvent l'arrière par défaut)
                if (videoDevices.length > 0) {
                    setSelectedDeviceId(videoDevices[0].deviceId);
                    await startCamera(videoDevices[0].deviceId);
                } else {
                    setDebug("Aucune caméra trouvée");
                }
            } catch (err) {
                console.error("Erreur init caméras:", err);
            }
        };

        initCameras();

        return () => {
            if (stream) {
                stream.getTracks().forEach(track => track.stop());
            }
        };
    }, []);

    // Redessiner l'overlay (inchangé)
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

                ctx.fillStyle = "rgba(0,0,0,0.5)";
                ctx.fillRect(0, 0, overlay.width, overlay.height);
                ctx.clearRect(x, y, FRAME_WIDTH, FRAME_HEIGHT);

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
    }, [videoRef.current]);

    // Capture et envoi (inchangé)
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
    }, [detected, isScanning, stream]);

    // Gestionnaire de changement de caméra
    const handleCameraChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
        const deviceId = event.target.value;
        setSelectedDeviceId(deviceId);
        startCamera(deviceId);
    };

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

            {/* Sélecteur de caméra */}
            {devices.length > 1 && isScanning && !detected && (
                <div className="absolute top-4 left-4 bg-black bg-opacity-70 text-white p-2 rounded-lg text-sm">
                    <label htmlFor="camera-select" className="block mb-1">Caméra :</label>
                    <select
                        id="camera-select"
                        value={selectedDeviceId}
                        onChange={handleCameraChange}
                        className="bg-gray-800 text-white p-1 rounded"
                    >
                        {devices.map((device) => (
                            <option key={device.deviceId} value={device.deviceId}>
                                {device.label || `Caméra ${device.deviceId.slice(0, 5)}...`}
                            </option>
                        ))}
                    </select>
                </div>
            )}

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