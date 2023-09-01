import React, { useEffect, useRef, useState } from "react";
import videojs from "video.js";
import {
  VideoJSQualityPlugin,
  VideoJSIVSTech,
  VideoJSEvents,
} from "amazon-ivs-player";
import { Flex, IconButton, Text } from "@chakra-ui/react";
import { RiPictureInPicture2Fill } from "react-icons/ri";

import useUserAgent from "../../hooks/internal/useUserAgent";

type Props = {
  playbackUrl: string;
};

const IVSPlayer: React.FunctionComponent<Props> = ({ playbackUrl }) => {
  const [offline, setOffline] = useState<boolean>(false);

  const { isStandalone } = useUserAgent();

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [logs, setLogs] = useState<string[]>([]);

  const togglePiP = () => {
    setLogs([...logs, "toggling pip"]);
    if (document.pictureInPictureElement) {
      setLogs([...logs, "pip element exists"]);
      document.exitPictureInPicture().catch((err) => {
        console.error("PiP Error:", err);
        setLogs([...logs, err.message]);
      });
    } else {
      setLogs([...logs, "pip element doesn't exist"]);
      if (videoRef.current) {
        setLogs([...logs, "videoRef exists"]);
        videoRef.current.requestPictureInPicture().catch((err) => {
          console.error("PiP Error:", err);
          setLogs([...logs, err.message]);
        });
      }
    }
  };

  const showOverlay = () => {
    const overlay = document.getElementById("video-overlay");

    if (overlay) {
      overlay.style.animationName = "none";

      requestAnimationFrame(() => {
        setTimeout(() => {
          overlay.style.animationName = "";
        }, 0);
      });
    }
  };

  useEffect(() => {
    const PLAYBACK_URL = playbackUrl;

    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    window.registerIVSTech(videojs);
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    window.registerIVSQualityPlugin(videojs);

    const player = videojs(
      "amazon-ivs-videojs",
      {
        techOrder: ["AmazonIVS"],
        autoplay: true,
      },
      () => {
        player.src(PLAYBACK_URL);
      }
    ) as videojs.Player & VideoJSIVSTech & VideoJSQualityPlugin;

    videoRef.current = player.el().getElementsByTagName("video")[0];

    player.enableIVSQualityPlugin();

    const events: VideoJSEvents = player.getIVSEvents();
    const ivsPlayer = player.getIVSPlayer();

    const errorHandler = (payload: any) => {
      setOffline(true);
    };

    ivsPlayer.addEventListener(events.PlayerEventType.ERROR, errorHandler);

    return () => {
      ivsPlayer.removeEventListener(events.PlayerEventType.ERROR, errorHandler);
      player.dispose();
    };
  }, [playbackUrl]);

  return (
    <>
      <Flex
        direction="column"
        width={"100%"}
        position="relative"
        onMouseMove={showOverlay}
        onTouchStart={showOverlay}
      >
        <video
          ref={videoRef}
          id="amazon-ivs-videojs"
          className="video-js vjs-4-3 vjs-big-play-centered"
          controls
          autoPlay
          playsInline
          style={{
            padding: "0px !important",
            maxWidth: "100%",
            height: "100% !important",
            width: "100% !important",
            borderRadius: "10px",
            minHeight: "100%",
          }}
        />
        {!offline && (
          <Flex
            direction="column"
            bg="rgba(0, 0, 0, 0)"
            position="absolute"
            top={0}
            right={0}
            bottom={0}
            left={0}
            justifyContent="center"
            alignItems="center"
            className="show-then-hide"
            id="video-overlay"
          >
            <IconButton
              position="absolute"
              aria-label="picture-in-picture"
              icon={<RiPictureInPicture2Fill size="20px" />}
              bg="rgb(0, 0, 0, 0.5)"
              onClick={togglePiP}
              _hover={{}}
              _focus={{}}
              _active={{}}
              borderWidth="1px"
              zIndex="20"
              borderRadius={"50%"}
              top="1rem"
              left="1rem"
              pointerEvents="auto"
            />
          </Flex>
        )}
        {logs.map((log, index) => (
          <Text key={index}>{log}</Text>
        ))}
        {offline && (
          <Flex
            direction="column"
            bg="black"
            position="absolute"
            width="100%"
            height="100%"
            justifyContent={"center"}
            gap="20px"
          >
            <Text
              fontFamily="Neue Pixel Sans"
              textAlign="center"
              fontSize="30px"
            >
              stream offline
            </Text>
            {!isStandalone && (
              <Text
                fontFamily="Neue Pixel Sans"
                textAlign="center"
                fontSize="18px"
              >
                or install the app on your mobile device to sign up for future
                notifications
              </Text>
            )}
          </Flex>
        )}
      </Flex>
    </>
  );
};

export default IVSPlayer;
