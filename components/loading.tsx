import Image from "next/image";

function Loading() {
  return (
    <Image
      className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2"
      src={"/favicon.svg"}
      alt="Loading..."
      width={48}
      height={48}
    />
  );
}

export default Loading;
