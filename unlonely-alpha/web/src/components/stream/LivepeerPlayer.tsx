import { memo, useRef, useState } from "react";
import {
  Button,
  Flex,
  IconButton,
  Spinner,
  Text,
  useToast,
} from "@chakra-ui/react";
import { Src } from "@livepeer/react";
import * as Player from "@livepeer/react/player";
import {
  EnterFullscreenIcon,
  ExitFullscreenIcon,
  MuteIcon,
  PauseIcon,
  PictureInPictureIcon,
  PlayIcon,
  UnmuteIcon,
} from "@livepeer/react/assets";
import { BiRefresh } from "react-icons/bi";
import copy from "copy-to-clipboard";
import useUserAgent from "../../hooks/internal/useUserAgent";

const LivepeerPlayer = memo(
  ({
    src,
    isPreview,
    customSizePercentages,
  }: {
    src: Src[] | null;
    isPreview?: boolean;
    customSizePercentages?: { width: `${number}%`; height: `${number}%` };
  }) => {
    const { isStandalone } = useUserAgent();
    const [opacity, setOpacity] = useState(0);
    const toast = useToast();

    const timeoutRef = useRef<number | NodeJS.Timeout | null>(null);
    const [error, setError] = useState<string | null>(null);

    const handleOpacity = () => {
      setOpacity(1); // Set opacity to 1 on touch
      // Clear any existing timeout to prevent it from resetting opacity prematurely
      if (timeoutRef.current !== null) {
        clearTimeout(timeoutRef.current);
      }

      // Set a new timeout and store its ID in the ref
      timeoutRef.current = setTimeout(() => {
        setOpacity(0); // Change back to 0 after 3 seconds
        timeoutRef.current = null; // Reset the ref after the timeout completes
      }, 2000);
    };

    const handleCopy = () => {
      toast({
        title: "copied to clipboard",
        status: "success",
        duration: 2000,
        isClosable: true,
      });
    };

    if (!src) {
      return (
        <Flex
          width="100%"
          height="100%"
          backgroundColor={"black"}
          position="relative"
        >
          <Flex
            style={{
              position: "absolute",
              transform: "translate(-50%, -50%)",
              top: "50%",
              left: "50%",
            }}
          >
            <Spinner />
          </Flex>
        </Flex>
      );
    }
    return (
      <Flex
        direction="column"
        width={customSizePercentages?.width ?? "100%"}
        height={customSizePercentages?.height ?? "100%"}
        position="relative"
        onTouchStart={handleOpacity} // Handle touch event
        onMouseMove={handleOpacity} // Set opacity to 1 on mouse enter
      >
        <Player.Root aspectRatio={null} src={src} autoPlay>
          <Player.Container
            style={{
              backgroundColor: "black",
              width: "100%",
              height: "100%",
            }}
          >
            <Player.Video
              muted
              style={{
                height: "100%",
                margin: "auto",
                objectFit: "contain",
              }}
              onError={(e) => {
                console.error("Error playing video", stringifyEvent(e));
                setError(stringifyEvent(e));
              }}
            />
            <Player.LoadingIndicator
              asChild
              style={{
                position: "absolute",
                transform: "translate(-50%, -50%)",
                top: "50%",
                left: "50%",
              }}
            >
              <Flex justifyContent={"center"}>
                <Spinner size="lg" />
              </Flex>
            </Player.LoadingIndicator>

            <Flex
              style={{
                position: "absolute",
                transform: "translate(-50%, -50%)",
                top: "50%",
                left: "50%",
              }}
            >
              <Player.PlayingIndicator asChild matcher={false}>
                <PlayIcon
                  style={{
                    width: isPreview ? 25 : 100,
                    height: isPreview ? 25 : 100,
                  }}
                />
              </Player.PlayingIndicator>
              <Player.VolumeIndicator asChild matcher={false}>
                <MuteIcon
                  style={{
                    width: isPreview ? 25 : 100,
                    height: isPreview ? 25 : 100,
                  }}
                />
              </Player.VolumeIndicator>
            </Flex>
            <Player.ErrorIndicator
              matcher="all"
              asChild
              style={{
                position: "absolute",
                transform: "translate(-50%, -50%)",
                top: "50%",
                left: "50%",
              }}
            >
              <Flex
                bg="black"
                style={{
                  width: "100%",
                  height: "100%",
                }}
              >
                <Flex
                  direction="column"
                  margin="auto"
                  alignItems={"center"}
                  p="5px"
                  gap="10px"
                >
                  {error ? (
                    <>
                      <Text
                        textAlign="center"
                        fontSize={
                          isPreview
                            ? ["1rem", "1rem", "2rem", "2rem"]
                            : !isStandalone
                            ? "3rem"
                            : "1rem"
                        }
                        fontFamily={"LoRes15"}
                      >
                        Error detected while playing video
                      </Text>
                      <Button
                        color="white"
                        width="100%"
                        bg="#b82929"
                        onClick={() => {
                          copy(error);
                          handleCopy();
                        }}
                        _focus={{}}
                        _hover={{ background: "#f25719" }}
                      >
                        copy error
                      </Button>
                    </>
                  ) : (
                    <>
                      <Text
                        textAlign="center"
                        fontSize={
                          isPreview
                            ? ["1rem", "1rem", "2rem", "2rem"]
                            : !isStandalone
                            ? "3rem"
                            : "1rem"
                        }
                        fontFamily={"LoRes15"}
                      >
                        Stream is offline
                      </Text>
                      {!isPreview && (
                        <Text textAlign="center">
                          Refresh for the latest streaming updates
                        </Text>
                      )}
                      <IconButton
                        color="white"
                        aria-label="refresh"
                        icon={<BiRefresh size="30px" />}
                        bg="rgb(0, 0, 0, 0.5)"
                        onClick={() => window?.location?.reload()}
                        _hover={{
                          bg: "rgb(255,255,255, 0.1)",
                        }}
                        _focus={{}}
                        _active={{}}
                        borderWidth="1px"
                        zIndex="1"
                      />
                    </>
                  )}
                </Flex>
              </Flex>
            </Player.ErrorIndicator>
            <div
              style={{
                position: "absolute",
                bottom: 0,
                display: "flex",
                alignItems: "center",
                gap: 10,
                width: "100%",
                opacity,
                transition: "opacity 0.5s",
                background:
                  "linear-gradient(to bottom, rgba(0, 0, 0, 0.5), rgba(0, 0, 0, 0.9))",
              }}
            >
              <Player.PlayPauseTrigger
                style={{
                  width: 25,
                  height: 25,
                }}
              >
                <Player.PlayingIndicator asChild matcher={false}>
                  <PlayIcon />
                </Player.PlayingIndicator>
                <Player.PlayingIndicator asChild>
                  <PauseIcon />
                </Player.PlayingIndicator>
              </Player.PlayPauseTrigger>
              <Player.MuteTrigger
                style={{
                  width: 25,
                  height: 25,
                }}
              >
                <Player.VolumeIndicator asChild matcher={false}>
                  <MuteIcon />
                </Player.VolumeIndicator>
                <Player.VolumeIndicator asChild matcher={true}>
                  <UnmuteIcon />
                </Player.VolumeIndicator>
              </Player.MuteTrigger>
              <Player.Volume
                style={{
                  position: "relative",
                  display: "flex",
                  flexGrow: 1,
                  height: 25,
                  alignItems: "center",
                  maxWidth: 120,
                  touchAction: "none",
                  userSelect: "none",
                }}
              >
                <Player.Track
                  style={{
                    backgroundColor: "rgba(255, 255, 255, 0.7)",
                    position: "relative",
                    flexGrow: 1,
                    borderRadius: 9999,
                    height: "2px",
                  }}
                >
                  <Player.Range
                    style={{
                      position: "absolute",
                      backgroundColor: "white",
                      borderRadius: 9999,
                      height: "100%",
                    }}
                  />
                </Player.Track>
                <Player.Thumb
                  style={{
                    display: "block",
                    width: 12,
                    height: 12,
                    backgroundColor: "white",
                    borderRadius: 9999,
                  }}
                />
              </Player.Volume>
              {!isPreview && (
                <>
                  <Player.PictureInPictureTrigger
                    style={{
                      width: 25,
                      height: 25,
                    }}
                  >
                    <PictureInPictureIcon />
                  </Player.PictureInPictureTrigger>
                  <Player.FullscreenTrigger
                    style={{
                      position: "absolute",
                      right: 20,
                      width: 25,
                      height: 25,
                    }}
                  >
                    <Player.FullscreenIndicator asChild matcher={false}>
                      <EnterFullscreenIcon />
                    </Player.FullscreenIndicator>
                    <Player.FullscreenIndicator asChild>
                      <ExitFullscreenIcon />
                    </Player.FullscreenIndicator>
                  </Player.FullscreenTrigger>
                </>
              )}
            </div>
          </Player.Container>
        </Player.Root>
      </Flex>
    );
  },
  (prevProps, nextProps) => {
    return prevProps.src === nextProps.src;
  }
);

const stringifyEvent = (event: any) => {
  const obj: any = {};
  for (const key in event) {
    obj[key] = event[key];
  }
  return JSON.stringify(
    obj,
    (key, value) => {
      if (value instanceof Node) return "Node";
      if (value instanceof Window) return "Window";
      return value;
    },
    "  "
  );
};

export default LivepeerPlayer;
