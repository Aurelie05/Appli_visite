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

            setDebug("Caméra démarrée avec succès");
        } catch (err: unknown) {
            const error = err as Error;
            console.error("Erreur caméra:", error);
            setDebug(`Erreur caméra: ${error.message}`);
        }
    }, [stream]);

    // ✅ SÉLECTION STRICTE: Camera 2.0 facing back uniquement
    useEffect(() => {
        let mounted: boolean = true;

        const initCamera = async (): Promise<void> => {
            try {
                // Obtenir la permission d'abord
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

                // Debug: afficher toutes les caméras trouvées
                console.log("Caméras disponibles:");
                videoDevices.forEach((d, i) => {
                    console.log(`${i}: ${d.label} (ID: ${d.deviceId.substring(0, 8)}...)`);
                });

                setDebug(`${videoDevices.length} caméra(s) trouvée(s)`);

                // ✅ RECHERCHE EXACTE: "Camera 2.0 facing back"
                // On exclut explicitement la 2.2 et tout autre numéro
                let selectedDevice: VideoDevice | undefined;

                // Priorité 1: Label exact "Camera 2.0 facing back"
                selectedDevice = videoDevices.find((d: VideoDevice) =>
                    d.label === "Camera 2.0 facing back"
                );

                // Priorité 2: Contient "2.0" mais PAS "2.2" et contient "back"
                if (!selectedDevice) {
                    selectedDevice = videoDevices.find((d: VideoDevice) =>
                        d.label.includes("2.0") &&
                        !d.label.includes("2.2") &&
                        !d.label.includes("2.1") &&
                        d.label.toLowerCase().includes("back")
                    );
                }

                // Priorité 3: Contient "camera 2" mais PAS "2.2", "2.1", "2.3", etc.
                if (!selectedDevice) {
                    selectedDevice = videoDevices.find((d: VideoDevice) => {
                        const lowerLabel = d.label.toLowerCase();
                        return (
                            lowerLabel.includes("camera 2") &&
                            !lowerLabel.includes("2.1") &&
                            !lowerLabel.includes("2.2") &&
                            !lowerLabel.includes("2.3") &&
                            !lowerLabel.includes("2.4") &&
                            lowerLabel.includes("back")
                        );
                    });
                }

                // ❌ PAS DE FALLBACK sur caméra 2.2 - on préfère échouer
                if (!selectedDevice) {
                    setDebug("❌ Caméra 2.0 facing back non trouvée !");
                    console.error("Caméra 2.0 facing back non trouvée. Caméras disponibles:",
                        videoDevices.map(d => d.label)
                    );
                    return;
                }

                // Vérification finale qu'on n'a pas sélectionné la 2.2 par erreur
                if (selectedDevice.label.includes("2.2")) {
                    setDebug("❌ ERREUR: Caméra 2.2 sélectionnée par erreur");
                    console.error("ERREUR: Caméra infrarouge 2.2 détectée, arrêt");
                    return;
                }

                setDeviceLabel(selectedDevice.label);
                setDebug(`✅ Caméra sélectionnée: ${selectedDevice.label}`);
                await startCamera(selectedDevice.deviceId);

            } catch (err: unknown) {
                if (!mounted) return;
                const error = err as Error;
                console.error("Erreur init caméra:", error);
                setDebug(`Erreur init: ${error.message}`);
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
                    ctx.fillText("🔍 Analyse en cours...", overlay.width / 2, y + FRAME_HEIGHT + 40);
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

        if (!video || !canvas || detected || !isScanning) return;

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
                            console.log("CNI détectée:", result);
                            setDetected(true);
                            setIsScanning(false);
                            setDebug("✅ CNI détectée avec succès !");

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
                            setDebug("❌ Aucune CNI détectée. Ajustez la carte.");
                        }
                    },
                    onError: (errors: Record<string, string>): void => {
                        console.error("Erreur OCR:", errors);
                        setDebug(`Erreur OCR: ${JSON.stringify(errors)}`);
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

            <div className="absolute bottom-8 left-0 right-0 flex flex-col items-center gap-4">
                {!detected && isScanning && (
                    <div className="bg-black/80 text-white px-6 py-3 rounded-full text-lg font-medium">
                        {debug || "Placez la carte dans le cadre vert..."}
                    </div>
                )}

                {detected && (
                    <div className="bg-green-600 text-white px-6 py-3 rounded-full text-lg font-bold animate-pulse">
                        CNI détectée ! Redirection...
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

            {stream && (
                <div className="absolute top-6 left-6 flex items-center gap-2 bg-black/60 text-white px-4 py-2 rounded-full text-sm">
                    <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse" />
                    <span className="truncate max-w-[200px]">
                        {deviceLabel || "Caméra active"}
                    </span>
                </div>
            )}
        </div>
    );
}