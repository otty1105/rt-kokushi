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

      <div className="grid grid-cols-2 gap-3 w-full max-w-xl">
        <Link
          href="/study"
          className="group flex flex-col items-center text-center rounded-2xl border-2 border-emerald-600 px-4 py-5 hover:bg-emerald-600 transition-colors"
        >
          <p className="text-base font-bold text-emerald-700 group-hover:text-white transition-colors">自己学習モード</p>
          <p className="text-xs text-gray-500 group-hover:text-emerald-100 transition-colors mt-1">
            科目・午前午後で絞り込み、解答直後に正解を確認
          </p>
        </Link>

        <Link
          href="/test"
          className="group flex flex-col items-center text-center rounded-2xl border-2 border-blue-600 px-4 py-5 hover:bg-blue-600 transition-colors"
        >
          <p className="text-base font-bold text-blue-700 group-hover:text-white transition-colors">テストモード</p>
          <p className="text-xs text-gray-500 group-hover:text-blue-100 transition-colors mt-1">
            年度・午前午後を選んで本番形式で解答・採点
          </p>
          <p className="text-[11px] text-blue-500 group-hover:text-blue-100 transition-colors mt-1">
            ※ログインが必要です
          </p>
        </Link>
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
