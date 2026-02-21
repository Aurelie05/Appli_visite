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
const SCAN_INTERVAL: number = 3000;
const JPEG_QUALITY: number = 0.95;

export default function AutoScanCNI(): JSX.Element {
    const videoRef = useRef<HTMLVideoElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const overlayRef = useRef<HTMLCanvasElement>(null);

    const [stream, setStream] = useState<MediaStream | null>(null);
    const [detected, setDetected] = useState<boolean>(false);
    const [isScanning, setIsScanning] = useState<boolean>(true);
    const [debug, setDebug] = useState<string>("");
    const [deviceLabel, setDeviceLabel] = useState<string>("");
    const [availableCameras, setAvailableCameras] = useState<VideoDevice[]>([]);
    const [showSelector, setShowSelector] = useState<boolean>(false);

    const startCamera = useCallback(async (deviceId: string): Promise<void> => {
        if (stream) {
            stream.getTracks().forEach((track: MediaStreamTrack) => track.stop());
        }

        try {
            const constraints: MediaStreamConstraints = {
                video: {
                    deviceId: { exact: deviceId },
                    width: { ideal: 1920 },
                    height: { ideal: 1080 },
                } as MediaTrackConstraints
            };

            const mediaStream: MediaStream = await navigator.mediaDevices.getUserMedia(constraints);

            setStream(mediaStream);

            if (videoRef.current) {
                videoRef.current.srcObject = mediaStream;
                await videoRef.current.play();
            }

            setDebug("Caméra démarrée");
        } catch (err: unknown) {
            const error = err as Error;
            console.error("Erreur caméra:", error);
            setDebug(`Erreur: ${error.message}`);
        }
    }, [stream]);

    // ✅ DÉTECTION PRIORITAIRE CAMERA 2.0
    useEffect(() => {
        let mounted: boolean = true;

        const initCamera = async (): Promise<void> => {
            try {
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

                if (!mounted) return;

                console.log("=== CAMÉRAS DÉTECTÉES ===");
                videoDevices.forEach((d, i) => {
                    console.log(`[${i}] "${d.label}"`);
                });

                setAvailableCameras(videoDevices);
                setDebug(`${videoDevices.length} caméra(s)`);

                // ✅ ORDRE DE PRIORITÉ STRICT:
                // 1. Camera 2.0 facing back (match exact)
                // 2. Contient "2.0" et "back" (mais pas 2.2)
                // 3. Camera 2 facing back (sans point, sans 2.2)

                let selectedDevice: VideoDevice | undefined;
                const cameras2point0: VideoDevice[] = [];
                const camerasBack: VideoDevice[] = [];

                // Trier les caméras par catégorie
                videoDevices.forEach((d) => {
                    const lower = d.label.toLowerCase();

                    // Catégorie A: Contient "2.0"
                    if (lower.includes("2.0") && lower.includes("back")) {
                        cameras2point0.push(d);
                    }
                    // Catégorie B: Back sans infrarouge
                    else if (lower.includes("back") &&
                        !lower.includes("2.2") &&
                        !lower.includes("ir") &&
                        !lower.includes("infrared") &&
                        !lower.includes("thermal")) {
                        camerasBack.push(d);
                    }
                });

                console.log("Caméras 2.0 trouvées:", cameras2point0.map(d => d.label));
                console.log("Autres caméras back:", camerasBack.map(d => d.label));

                // Sélection prioritaire
                if (cameras2point0.length > 0) {
                    // Prendre la première caméra 2.0 (normalement il n'y en a qu'une)
                    selectedDevice = cameras2point0[0];
                    console.log("✅ Sélection 2.0:", selectedDevice.label);
                } else if (camerasBack.length > 0) {
                    // Fallback sur autre caméra back (mais pas 2.2)
                    selectedDevice = camerasBack[0];
                    console.log("⚠️ Fallback sur:", selectedDevice.label);
                }

                if (selectedDevice) {
                    // Vérification de sécurité anti-2.2
                    if (selectedDevice.label.includes("2.2")) {
                        console.error("❌ ERREUR: 2.2 sélectionnée!");
                        setDebug("Erreur: caméra infrarouge détectée");
                        setShowSelector(true);
                        return;
                    }

                    setDeviceLabel(selectedDevice.label);
                    setDebug(`✅ ${selectedDevice.label}`);
                    await startCamera(selectedDevice.deviceId);
                } else {
                    setDebug("⚠️ Aucune caméra 2.0 trouvée");
                    setShowSelector(true);
                }

            } catch (err: unknown) {
                if (!mounted) return;
                const error = err as Error;
                console.error("Erreur:", error);
                setDebug(`Erreur: ${error.message}`);
            }
        };

        initCamera();

        return (): void => {
            mounted = false;
            if (stream) {
                stream.getTracks().forEach((track: MediaStreamTrack) => track.stop());
            }
        };
    }, [startCamera, stream]);

    const handleManualSelect = (deviceId: string, label: string): void => {
        setDeviceLabel(label);
        setShowSelector(false);
        startCamera(deviceId);
    };

    useEffect(() => {
        const video: HTMLVideoElement | null = videoRef.current;
        const overlay: HTMLCanvasElement | null = overlayRef.current;

        if (!video || !overlay) return;

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
                    ctx.fillText("🔍 Analyse...", overlay.width / 2, y + FRAME_HEIGHT + 40);
                }
            }

            requestAnimationFrame(drawFrame);
        };

        const animationId: number = requestAnimationFrame(drawFrame);
        return (): void => cancelAnimationFrame(animationId);
    }, [isScanning, detected]);

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
            setDebug(`Capture: ${new Date().toLocaleTimeString()}`);

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
                            setDebug("❌ Pas de CNI détectée");
                        }
                    },
                    onError: (errors: Record<string, string>): void => {
                        console.error("Erreur OCR:", errors);
                        setDebug(`Erreur: ${JSON.stringify(errors)}`);
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

            {showSelector && (
                <div className="absolute inset-0 bg-black/90 flex flex-col items-center justify-center z-50 p-4">
                    <h2 className="text-white text-xl font-bold mb-4">
                        Sélectionnez la caméra 2.0
                    </h2>
                    <p className="text-gray-400 text-sm mb-6">
                        Évitez la 2.2 (infrarouge)
                    </p>

                    <div className="space-y-2 w-full max-w-md">
                        {availableCameras.map((camera, index) => (
                            <button
                                key={camera.deviceId}
                                onClick={() => handleManualSelect(camera.deviceId, camera.label)}
                                className={`w-full p-4 rounded-lg text-left transition-colors ${camera.label.includes("2.2")
                                        ? "bg-red-900/50 border border-red-500 text-red-200"
                                        : camera.label.includes("2.0")
                                            ? "bg-green-900/50 border border-green-500 text-green-200"
                                            : "bg-gray-800 hover:bg-gray-700 text-white"
                                    }`}
                            >
                                <div className="font-medium">
                                    {index + 1}. {camera.label || `Caméra ${index + 1}`}
                                </div>
                                {camera.label.includes("2.2") && (
                                    <div className="text-xs text-red-400 mt-1">⚠️ INFRAROUGE</div>
                                )}
                                {camera.label.includes("2.0") && (
                                    <div className="text-xs text-green-400 mt-1">✅ RECOMMANDÉE</div>
                                )}
                            </button>
                        ))}
                    </div>
                </div>
            )}

            {!showSelector && (
                <>
                    <div className="absolute bottom-8 left-0 right-0 flex flex-col items-center gap-4">
                        {!detected && isScanning && (
                            <div className="bg-black/80 text-white px-6 py-3 rounded-full text-lg font-medium">
                                {debug}
                            </div>
                        )}

                        {detected && (
                            <div className="bg-green-600 text-white px-6 py-3 rounded-full text-lg font-bold animate-pulse">
                                CNI détectée !
                            </div>
                        )}
                    </div>

                    {isScanning && !detected && (
                        <button
                            type="button"
                            onClick={handleCancel}
                            className="absolute top-6 right-6 bg-red-600 hover:bg-red-700 text-white px-6 py-3 rounded-full text-lg font-medium transition-colors shadow-lg"
                        >
                            ✕ Annuler
                        </button>
                    )}

                    {!detected && (
                        <button
                            type="button"
                            onClick={() => setShowSelector(true)}
                            className="absolute top-6 left-6 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-full text-sm font-medium transition-colors shadow-lg"
                        >
                            🎥 Changer caméra
                        </button>
                    )}

                    {stream && (
                        <div className="absolute top-20 left-6 flex items-center gap-2 bg-black/60 text-white px-4 py-2 rounded-full text-sm">
                            <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse" />
                            <span className="truncate max-w-[200px]">{deviceLabel}</span>
                        </div>
                    )}
                </>
            )}
        </div>
    );
}