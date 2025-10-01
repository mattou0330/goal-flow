/**
 * 時間の表示を整形する関数
 * 60分は1時間に、1.5時間は1時間30分に変換
 */
export function formatTimeDisplay(quantity: number, unit: string): string {
  // 時間単位の場合
  if (unit === "時間") {
    const hours = Math.floor(quantity)
    const minutes = Math.round((quantity - hours) * 60)

    if (minutes === 0) {
      return `${hours}時間`
    }
    return `${hours}時間${minutes}分`
  }

  // 分単位の場合
  if (unit === "分") {
    if (quantity < 60) {
      return `${quantity}分`
    }

    const hours = Math.floor(quantity / 60)
    const minutes = Math.round(quantity % 60)

    if (minutes === 0) {
      return `${hours}時間`
    }
    return `${hours}時間${minutes}分`
  }

  // その他の単位はそのまま表示
  return `${quantity}${unit}`
}
