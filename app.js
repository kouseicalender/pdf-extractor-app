// PDF.js ワーカー設定（CDNから読み込み）
pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://unpkg.com/pdfjs-dist@3.4.120/build/pdf.worker.min.js';

console.log('✅ app.js loaded');

document.getElementById('pdf-upload').addEventListener('change', async (e) => {
  console.log('📤 PDFアップロード開始');

  const file = e.target.files[0];
  if (!file) {
    console.log('⚠️ ファイルが選択されていません');
    return;
  }

  const reader = new FileReader();
  reader.onload = async function () {
    const typedArray = new Uint8Array(this.result);
    const pdf = await pdfjsLib.getDocument({ data: typedArray }).promise;
    console.log(`📄 PDFページ数: ${pdf.numPages}`);

    const allLines = [];

    for (let i = 1; i <= pdf.numPages; i++) {
      const page = await pdf.getPage(i);
      const content = await page.getTextContent();
      const lines = content.items.map(item => item.str.trim()).filter(t => t.length > 0);
      console.log(`📃 Page ${i} 行数: ${lines.length}`);
      allLines.push(...lines);
    }

    const quotes = extractQuotes(allLines);

    const output = document.getElementById('output');
    if (!output) {
      console.error("❌ <div id='output'> が見つかりません！");
      return;
    }

    output.innerHTML = ''; // 初期化

    for (const quote of quotes) {
      const block = document.createElement('div');
      block.style.marginBottom = '2em';

      block.innerHTML = `
        <h3>${quote.day}</h3>
        <p><strong>日本語:</strong> ${quote.ja}</p>
        <p><strong>英語:</strong> ${quote.en}</p>
        <p><strong>出典:</strong> ${quote.author}</p>
      `;

      output.appendChild(block);
    }

    console.log(`✅ 抽出完了: ${quotes.length}件`);
  };

  reader.readAsArrayBuffer(file);
});

function extractQuotes(lines) {
  const results = [];
  let day = 1;

  for (let i = 0; i < lines.length - 6; i++) {
    const isYear = lines[i + 5] === '2026';
    const isNumber = /^\d{3}$/.test(lines[i + 6]);

    if (isYear && isNumber) {
      const person = lines[i];
      const info = lines[i + 1];
      const en = lines[i + 2];
      const ja1 = lines[i + 3];
      const ja2 = lines[i + 4];

      const ja = (ja1 + ' ' + ja2).replace(/\s+/g, ' ').trim();

      results.push({
        day: `1/${day}`,
        ja,
        en,
        author: `${person}${info}`
      });

      i += 6; // 次の名言へ
      day++;
    }
  }

  return results;
}
