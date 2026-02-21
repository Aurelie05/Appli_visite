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

    // 🔥 Cadre agrandi
    const FRAME_WIDTH = 600;
    const FRAME_HEIGHT = 380;

    // 🎯 Démarrage caméra spécifique
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
                videoRef.current.play();
            }

        } catch (err) {
            console.error(err);
            setDebug("Erreur caméra");
        }
    };

    // 🎯 Sélection automatique Camera 2.0 facing back
    useEffect(() => {
        const initCamera = async () => {
            try {
                const tempStream = await navigator.mediaDevices.getUserMedia({ video: true });
                tempStream.getTracks().forEach(track => track.stop());

                const devices = await navigator.mediaDevices.enumerateDevices();
                const videoDevices = devices.filter(d => d.kind === "videoinput");

                // 🔥 Trouver "Camera 2.0 facing back"
                const targetCamera =
                    videoDevices.find(d =>
                        d.label.toLowerCase().includes("camera 2.0") &&
                        d.label.toLowerCase().includes("back")
                    ) ||
                    videoDevices.find(d =>
                        d.label.toLowerCase().includes("back")
                    );

                if (targetCamera) {
                    setDebug(`Caméra utilisée : ${targetCamera.label}`);
                    await startCamera(targetCamera.deviceId);
                } else {
                    setDebug("Caméra arrière non trouvée");
                }

            } catch (err) {
                console.error(err);
                setDebug("Erreur initialisation caméra");
            }
        };

        initCamera();

        return () => {
            if (stream) {
                stream.getTracks().forEach(track => track.stop());
            }
        };
    }, []);

    // 🎨 Dessin du cadre
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

                ctx.fillStyle = "rgba(0,0,0,0.6)";
                ctx.fillRect(0, 0, overlay.width, overlay.height);
                ctx.clearRect(x, y, FRAME_WIDTH, FRAME_HEIGHT);

                ctx.strokeStyle = "#00ff00";
                ctx.lineWidth = 5;
                ctx.strokeRect(x, y, FRAME_WIDTH, FRAME_HEIGHT);

                ctx.font = "22px Arial";
                ctx.fillStyle = "white";
                ctx.fillText("Placez toute la CNI dans le cadre", x, y - 15);
            }

            requestAnimationFrame(drawFrame);
        };

        const animationId = requestAnimationFrame(drawFrame);
        return () => cancelAnimationFrame(animationId);
    }, []);

    // 📸 Capture
    useEffect(() => {
        if (!videoRef.current || !canvasRef.current) return;
        if (detected || !isScanning) return;

        const interval = setInterval(async () => {
            const video = videoRef.current!;
            const canvas = canvasRef.current!;
            const ctx = canvas.getContext("2d");
            if (!ctx) return;

            const videoWidth = video.videoWidth;
            const videoHeight = video.videoHeight;

            if (!videoWidth || !videoHeight) return;

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

            const base64 = canvas.toDataURL("image/jpeg", 0.95);

            router.post("/scan-cni", { image: base64 }, {
                preserveScroll: true,
                onSuccess: (page: any) => {
                    const data: ScanResult = page.props?.data || {};

                    if (data.nom || data.prenom || data.numero) {
                        setDetected(true);
                        setIsScanning(false);

                        stream?.getTracks().forEach(t => t.stop());

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
            });

        }, 3000);

        return () => clearInterval(interval);
    }, [detected, isScanning, stream]);

    return (
        <div className="relative w-full max-w-4xl mx-auto">
            <video
                ref={videoRef}
                autoPlay
                playsInline
                className="w-full rounded-lg"
            />

            <canvas
                ref={overlayRef}
                className="absolute top-0 left-0 w-full h-full"
                style={{ pointerEvents: "none" }}
            />

            <canvas ref={canvasRef} style={{ display: "none" }} />

            {!detected && (
                <div className="absolute bottom-6 left-0 right-0 text-center">
                    <span className="bg-black bg-opacity-70 text-white px-6 py-3 rounded-full">
                        {debug || "Scan automatique en cours..."}
                    </span>
                </div>
            )}
        </div>
    );
}
