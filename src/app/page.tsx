'use client'

import { InputFile } from "@/components/input-file";
import { Button } from "@/components/ui/button";
import JSZip from "jszip";
import { useState, useCallback } from "react";
import { pdfjs, Page, Document } from "react-pdf";

pdfjs.GlobalWorkerOptions.workerSrc = new URL(
  'pdfjs-dist/build/pdf.worker.min.js',
  import.meta.url,
).toString();

export default function Home() {
  const [isLoading, setIsLoading] = useState(false);
  const [numPages, setNumPages] = useState<number | null>(null);
  const [imageUrlArray, setImageUrlArray] = useState<{ index: number, url: string }[]>([]);
  const [selectedPDFFile, setSelectedPDFFile] = useState<File | undefined>(undefined);


  const handleFile = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    setImageUrlArray([])

    if (file?.type.length) {
      if (file.type === 'application/pdf') {
        setIsLoading(true)
        setSelectedPDFFile(file)
      } else {
        setImageUrlArray([{ index: 0, url: URL.createObjectURL(file).toString() }])
      }
    }
  };

  const onLoadSuccess = ({ numPages }: { numPages: number }) => {
    setNumPages(numPages)
    setIsLoading(false);
  }

  const onRenderSuccess = useCallback(({ _pageIndex }: { _pageIndex: number }) => {
    Array.from(new Array(numPages), (el, index) => {
      const importPDFCanvas: HTMLCanvasElement | null =
        document.querySelector(`[data-page-number="${index + 1}"]`)?.firstChild as HTMLCanvasElement | null

      if (importPDFCanvas && _pageIndex === index) {
        importPDFCanvas.toBlob(blob => {
          blob && setImageUrlArray((prevState: { index: number, url: string }[]) => [
            ...prevState,
            {
              index: _pageIndex,
              url: URL.createObjectURL(blob),
            }
          ])
        })
      }
    })
  }, [numPages])

  const handleDownload = () => {
    const zip = new JSZip();
    const folder = zip.folder('images');
    const promises = imageUrlArray.map(({ index, url }) => {
      return fetch(url)
        .then(response => response.blob())
        .then(blob => {
          folder?.file(`image-${index + 1}.png`, blob);
        });
    });

    Promise.all(promises).then(() => {
      zip.generateAsync({ type: 'blob' }).then(content => {
        const a = document.createElement('a');
        const url = URL.createObjectURL(content);
        a.href = url;
        a.download = 'images.zip';
        a.click();
        URL.revokeObjectURL(url);
      });
    });
  }

  return (
    <main className="flex min-h-screen flex-col items-center p-24 gap-4">
      <div className="flex gap-2 flex-col">
        <InputFile id="input-file" onChange={handleFile} />

        {isLoading && <div>loading...</div>}

        {selectedPDFFile && (
          <>
            <Document
              className='flex gap-2 flex-wrap'
              file={selectedPDFFile}
              onLoadSuccess={onLoadSuccess}
              error={<div>An error occurred!</div>}
            >
              {Array.from(new Array(numPages), (_, index) => (
                <Page
                  key={`page-${index + 1}`}
                  pageNumber={index + 1}
                  className={`import-pdf-page-${index + 1} [&_*]:max-w-40 [&_*]:max-h-24`}
                  onRenderSuccess={onRenderSuccess}
                  width={1920}
                  renderTextLayer={false}
                  renderAnnotationLayer={false}
                  onClick={() => console.log('clicked')}
                  error={<div>An error occurred!</div>}
                />
              ))}
            </Document>

            <Button className='max-w-24' onClick={handleDownload}>Download</Button>
          </>
        )}
      </div>
    </main>
  );
}
