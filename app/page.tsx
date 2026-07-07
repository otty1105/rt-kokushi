import Link from "next/link";
import HomePreview from "@/components/HomePreview";

export default function Home() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[70vh] gap-10">
      <div className="text-center">
        <p className="text-4xl sm:text-5xl font-extrabold text-blue-700 tracking-tight">MediOut</p>
        <p className="text-gray-700 font-semibold mt-2">アウトプットに特化した、みんなで作る問題集</p>
        <span className="inline-block text-xs font-bold text-blue-700 bg-blue-100 rounded-full px-3 py-1 mt-3">
          診療放射線技師 国家試験
        </span>
      </div>

      <HomePreview />

      <p className="text-xs text-gray-500 text-center">
        みんなで作るWebアプリです。気になることや要望は
        <Link href="/contact" className="underline hover:text-gray-700 mx-1">
          こちら
        </Link>
        から。
      </p>
    </div>
  );
}
