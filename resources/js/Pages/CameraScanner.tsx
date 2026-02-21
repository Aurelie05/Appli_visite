import React, { useRef, useEffect, useState, useCallback } from "react";
import { router } from "@inertiajs/react";

// Types
interface ScanResult {
    nom?: string;
    prenom?: string;
    numero?: string;
}

interface VideoDevice {
    deviceId: string;
    kind: MediaDeviceKind;
    label: string;
    groupId: string;
}

// Extension des props globales d'Inertia
declare module "@inertiajs/core" {
    interface PageProps {
        data?: ScanResult;
    }
}

// Constantes
const FRAME_WIDTH: number = 1280;
const FRAME_HEIGHT: number = 800;
const SCAN_INTERVAL: number = 8000; // 8 secondes
const JPEG_QUALITY: number = 0.95;

export default function AutoScanCNI(): JSX.Element {
    const videoRef = useRef<HTMLVideoElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const overlayRef = useRef<HTMLCanvasElement>(null);

    const [stream, setStream] = useState<MediaStream | null>(null);
    const [detected, setDetected] = useState<boolean>(false);
    const [isScanning, setIsScanning] = useState<boolean>(false);
    const [debug, setDebug] = useState<string>("Initialisation...");
    const [deviceLabel, setDeviceLabel] = useState<string>("");

    const [availableCameras, setAvailableCameras] = useState<VideoDevice[]>([]);
    const [showSelector, setShowSelector] = useState<boolean>(false);
    const [isInitialized, setIsInitialized] = useState<boolean>(false); // ✅ Flag pour éviter re-render

    // ✅ Démarrer caméra - mémorisé une seule fois
    const startCamera = useCallback(async (deviceId: string, label: string): Promise<void> => {
        try {
            // Arrêter l'ancien stream si existe
            if (stream) {
                stream.getTracks().forEach((track: MediaStreamTrack) => track.stop());
            }

            const constraints: MediaStreamConstraints = {
                video: {
                    deviceId: { exact: deviceId },
                    width: { ideal: 1920 },
                    height: { ideal: 1080 },
                } as MediaTrackConstraints
            };

            const mediaStream: MediaStream = await navigator.mediaDevices.getUserMedia(constraints);

            setStream(mediaStream);
            setDeviceLabel(label);
            setShowSelector(false); // ✅ Cacher le sélecteur

            if (videoRef.current) {
                videoRef.current.srcObject = mediaStream;
                await videoRef.current.play();
            }

            setDebug(`✅ ${label} - Prêt à scanner`);
            setIsScanning(true);

        } catch (err: unknown) {
            const error = err as Error;
            console.error("Erreur caméra:", error);
            setDebug(`❌ Erreur: ${error.message}`);
            setShowSelector(true); // ✅ Re-montrer sélecteur en cas d'erreur
        }
    }, [stream]); // ✅ Dépendance stream mais pas de boucle car géré par le flag

    // ✅ INITIALISATION UNIQUE - ne se relance jamais
    useEffect(() => {
        // Éviter double exécution avec React StrictMode
        if (isInitialized) return;

        const initCamera = async (): Promise<void> => {
            try {
                setDebug("Recherche des caméras...");

                // Permission
                const tempStream: MediaStream = await navigator.mediaDevices.getUserMedia({ video: true });
                tempStream.getTracks().forEach((track: MediaStreamTrack) => track.stop());

                const devices: MediaDeviceInfo[] = await navigator.mediaDevices.enumerateDevices();
                const videoDevices: VideoDevice[] = devices
                    .filter((d: MediaDeviceInfo) => d.kind === "videoinput")
                    .map((d: MediaDeviceInfo) => ({
                        deviceId: d.deviceId,
                        kind: d.kind,
                        label: d.label,
                        groupId: d.groupId
                    }));

                console.log("=== CAMÉRAS ===");
                videoDevices.forEach((d, i) => console.log(`[${i}] "${d.label}"`));

                setAvailableCameras(videoDevices);
                setIsInitialized(true); // ✅ Marquer comme initialisé

                // Chercher caméra 2.0
                const camera20 = videoDevices.find((d: VideoDevice) => {
                    const lower = d.label.toLowerCase();
                    return lower.includes("2.0") && lower.includes("back");
                });

                if (camera20) {
                    console.log("Auto-démarrage 2.0:", camera20.label);
                    setDebug("Démarrage caméra 2.0...");
                    // ✅ Démarrer directement sans passer par le sélecteur
                    await startCamera(camera20.deviceId, camera20.label);
                } else {
                    console.log("Sélecteur manuel nécessaire");
                    setDebug("Choisissez la caméra 2.0");
                    setShowSelector(true);
                }

            } catch (err: unknown) {
                const error = err as Error;
                console.error("Erreur init:", error);
                setDebug(`Erreur: ${error.message}`);
                setShowSelector(true);
                setIsInitialized(true);
            }
        };

        initCamera();

        // ✅ Pas de cleanup qui relance tout
        return () => {
            // Nettoyage silencieux sans state update
            if (stream) {
                stream.getTracks().forEach((track: MediaStreamTrack) => track.stop());
            }
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []); // ✅ Tableau vide = exécution unique

    // ✅ HANDLER SÉLECTION - simple, sans effet de bord
    const handleManualSelect = useCallback((deviceId: string, label: string): void => {
        console.log("Sélection manuelle:", label);
        setDebug(`Chargement ${label}...`);
        startCamera(deviceId, label);
    }, [startCamera]);

    // Dessiner le cadre
    useEffect(() => {
        const video: HTMLVideoElement | null = videoRef.current;
        const overlay: HTMLCanvasElement | null = overlayRef.current;

        if (!video || !overlay) return;

        let animationId: number;

        const drawFrame = (): void => {
            if (video.readyState === video.HAVE_ENOUGH_DATA) {
                if (overlay.width !== video.videoWidth || overlay.height !== video.videoHeight) {
                    overlay.width = video.videoWidth;
                    overlay.height = video.videoHeight;
                }

                const ctx: CanvasRenderingContext2D | null = overlay.getContext("2d");
                if (!ctx) return;

                ctx.clearRect(0, 0, overlay.width, overlay.height);

                const x: number = (overlay.width - FRAME_WIDTH) / 2;
                const y: number = (overlay.height - FRAME_HEIGHT) / 2;

                ctx.fillStyle = "rgba(0, 0, 0, 0.6)";
                ctx.fillRect(0, 0, overlay.width, overlay.height);

                ctx.globalCompositeOperation = "destination-out";
                ctx.fillRect(x, y, FRAME_WIDTH, FRAME_HEIGHT);
                ctx.globalCompositeOperation = "source-over";

                ctx.strokeStyle = "#00ff00";
                ctx.lineWidth = 6;
                ctx.strokeRect(x, y, FRAME_WIDTH, FRAME_HEIGHT);

                const cornerSize: number = 40;
                ctx.lineWidth = 8;
                ctx.strokeStyle = "#00ff00";

                const drawCorner = (startX: number, startY: number, directionX: number, directionY: number): void => {
                    ctx.beginPath();
                    ctx.moveTo(startX, startY + cornerSize * directionY);
                    ctx.lineTo(startX, startY);
                    ctx.lineTo(startX + cornerSize * directionX, startY);
                    ctx.stroke();
                };

                drawCorner(x, y, 1, 1);
                drawCorner(x + FRAME_WIDTH, y, -1, 1);
                drawCorner(x, y + FRAME_HEIGHT, 1, -1);
                drawCorner(x + FRAME_WIDTH, y + FRAME_HEIGHT, -1, -1);

                ctx.font = "bold 28px Arial";
                ctx.fillStyle = "#00ff00";
                ctx.textAlign = "center";
                ctx.fillText("Placez la CNI entière dans le cadre", overlay.width / 2, y - 30);

                if (isScanning && !detected) {
                    ctx.font = "20px Arial";
                    ctx.fillStyle = "#ffffff";
                    ctx.fillText("🔍 Analyse en cours...", overlay.width / 2, y + FRAME_HEIGHT + 40);
                }
            }

            animationId = requestAnimationFrame(drawFrame);
        };

        drawFrame();

        return (): void => {
            cancelAnimationFrame(animationId);
        };
    }, [isScanning, detected]);

    // Scan OCR
    useEffect(() => {
        const video: HTMLVideoElement | null = videoRef.current;
        const canvas: HTMLCanvasElement | null = canvasRef.current;

        if (!video || !canvas || detected || !isScanning || !stream) return;

        const captureAndSend = async (): Promise<void> => {
            if (video.videoWidth === 0 || video.videoHeight === 0) return;

            const ctx: CanvasRenderingContext2D | null = canvas.getContext("2d");
            if (!ctx) return;

            const videoWidth: number = video.videoWidth;
            const videoHeight: number = video.videoHeight;
            const frameX: number = (videoWidth - FRAME_WIDTH) / 2;
            const frameY: number = (videoHeight - FRAME_HEIGHT) / 2;

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

            const imageData: ImageData = ctx.getImageData(0, 0, FRAME_WIDTH, FRAME_HEIGHT);
            const data: Uint8ClampedArray = imageData.data;

            for (let i: number = 0; i < data.length; i += 4) {
                const r: number = data[i];
                const g: number = data[i + 1];
                const b: number = data[i + 2];
                let gray: number = 0.34 * r + 0.5 * g + 0.16 * b;
                gray = gray > 128 ? Math.min(255, gray + 50) : Math.max(0, gray - 30);
                data[i] = gray;
                data[i + 1] = gray;
                data[i + 2] = gray;
            }

            ctx.putImageData(imageData, 0, 0);

            const base64: string = canvas.toDataURL("image/jpeg", JPEG_QUALITY);
            setDebug(`📸 Analyse... ${new Date().toLocaleTimeString()}`);

            router.post(
                "/scan-cni",
                { image: base64 },
                {
                    preserveScroll: true,
                    onSuccess: (page): void => {
                        const result: ScanResult = (page.props as { data?: ScanResult }).data ?? {};

                        if (result.nom || result.prenom || result.numero) {
                            setDetected(true);
                            setIsScanning(false);
                            setDebug("✅ CNI détectée !");
                            stream?.getTracks().forEach((track: MediaStreamTrack) => track.stop());

                            router.visit("/formulaire", {
                                method: "get",
                                data: {
                                    nom: result.nom ?? "",
                                    prenom: result.prenom ?? "",
                                    numero_cni: result.numero ?? "",
                                },
                            });
                        } else {
                            setDebug("❌ Pas de CNI - Réessayez");
                        }
                    },
                    onError: (): void => {
                        setDebug("Erreur serveur");
                    },
                }
            );
        };

        const intervalId: NodeJS.Timeout = setInterval(captureAndSend, SCAN_INTERVAL);
        return (): void => clearInterval(intervalId);
    }, [detected, isScanning, stream]);

    const handleCancel = (): void => {
        setIsScanning(false);
        stream?.getTracks().forEach((track: MediaStreamTrack) => track.stop());
        router.visit("/formulaire");
    };

    return (
        <div className="relative w-full h-screen bg-black overflow-hidden">
            <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className="absolute inset-0 w-full h-full object-cover"
            />

            <canvas
                ref={overlayRef}
                className="absolute inset-0 w-full h-full pointer-events-none"
            />

            <canvas ref={canvasRef} className="hidden" />

            {/* Sélecteur manuel */}
            {showSelector && (
                <div className="absolute inset-0 bg-black/95 flex flex-col items-center justify-center z-50 p-4">
                    <h2 className="text-white text-2xl font-bold mb-2">
                        Choisissez la caméra
                    </h2>
                    <p className="text-yellow-400 text-sm mb-6 text-center">
                        Sélectionnez "Camera 2.0 facing back"<br />
                        <span className="text-red-400">Évitez la 2.2 (infrarouge)</span>
                    </p>

                    <div className="space-y-3 w-full max-w-md">
                        {availableCameras.map((camera, index) => {
                            const is20 = camera.label.includes("2.0");
                            const is22 = camera.label.includes("2.2");

                            return (
                                <button
                                    key={camera.deviceId}
                                    onClick={() => handleManualSelect(camera.deviceId, camera.label)}
                                    className={`w-full p-4 rounded-xl text-left transition-all ${is22
                                            ? "bg-red-900/50 border-2 border-red-500 text-red-200"
                                            : is20
                                                ? "bg-green-900/50 border-2 border-green-500 text-green-200"
                                                : "bg-gray-800 hover:bg-gray-700 text-white"
                                        }`}
                                >
                                    <div className="font-bold text-lg">
                                        {is20 ? "✅ " : is22 ? "❌ " : "📷 "}
                                        {camera.label || `Caméra ${index + 1}`}
                                    </div>

                                    {is22 && (
                                        <div className="text-xs text-red-300 mt-1 font-bold">
                                            ⚠️ INFRAROUGE
                                        </div>
                                    )}
                                    {is20 && (
                                        <div className="text-xs text-green-300 mt-1 font-bold">
                                            ✓ Caméra normale
                                        </div>
                                    )}
                                </button>
                            );
                        })}
                    </div>
                </div>
            )}

            {/* UI normale */}
            {!showSelector && (
                <>
                    {/* Header */}
                    <div className="absolute top-0 left-0 right-0 bg-black/70 p-4">
                        <div className="flex items-center justify-between max-w-3xl mx-auto">
                            <div className="flex items-center gap-2">
                                <div className={`w-3 h-3 rounded-full ${isScanning ? 'bg-green-500 animate-pulse' : 'bg-yellow-500'}`} />
                                <span className="text-white text-sm font-medium truncate max-w-[200px]">
                                    {deviceLabel || "..."}
                                </span>
                            </div>
                            <span className="text-gray-300 text-xs">
                                {isScanning ? `Scan ${SCAN_INTERVAL / 1000}s` : 'Prêt'}
                            </span>
                        </div>
                    </div>

                    {/* Debug */}
                    <div className="absolute bottom-24 left-0 right-0 flex justify-center">
                        <div className="bg-black/80 text-white px-6 py-3 rounded-full text-base">
                            {debug}
                        </div>
                    </div>

                    {/* Boutons */}
                    <div className="absolute bottom-6 left-0 right-0 flex justify-center gap-4">
                        {!detected && (
                            <>
                                <button
                                    type="button"
                                    onClick={() => {
                                        // ✅ Arrêter stream actuel avant de montrer sélecteur
                                        if (stream) {
                                            stream.getTracks().forEach(t => t.stop());
                                            setStream(null);
                                        }
                                        setIsScanning(false);
                                        setShowSelector(true);
                                    }}
                                    className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-full font-medium"
                                >
                                    🎥 Changer caméra
                                </button>

                                <button
                                    type="button"
                                    onClick={handleCancel}
                                    className="bg-red-600 hover:bg-red-700 text-white px-6 py-3 rounded-full font-medium"
                                >
                                    ✕ Annuler
                                </button>
                            </>
                        )}
                    </div>

                    {detected && (
                        <div className="absolute inset-0 flex items-center justify-center bg-black/50">
                            <div className="bg-green-600 text-white px-8 py-4 rounded-2xl text-xl font-bold animate-pulse">
                                ✅ CNI détectée !
                            </div>
                        </div>
                    )}
                </>
            )}
        </div>
    );
}