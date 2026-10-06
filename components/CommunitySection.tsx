"use client";

import Image from "next/image";
import { useRef, useState } from "react";
import { community } from "../data/community";

export function CommunitySection() {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [imageFailed, setImageFailed] = useState(false);
  const { qr } = community;
  const qrSrc = imageFailed ? null : qr.src;

  return (
    <section
      id="community"
      className="community-section"
      aria-labelledby="community-heading"
    >
      <div className="community-copy">
        <span className="community-icon" aria-hidden="true">
          <svg width="30" height="30" viewBox="0 0 30 30" fill="none">
            <path
              d="M23 19c2-2 3-4 3-7 0-5-5-9-11-9S4 7 4 12c0 3 1 5 4 7l-1 6 6-4h2c3 0 5-1 8-2Z"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinejoin="round"
            />
            <circle cx="10" cy="12" r="1.2" fill="currentColor" />
            <circle cx="15" cy="12" r="1.2" fill="currentColor" />
            <circle cx="20" cy="12" r="1.2" fill="currentColor" />
          </svg>
        </span>
        <div>
          <h2 id="community-heading">{community.title}</h2>
          <p>{community.description}</p>
        </div>
      </div>
      <div className="community-qr">
        {qrSrc ? (
          <>
            <button
              className="qr-preview"
              type="button"
              aria-label="放大群二维码"
              onClick={() => dialogRef.current?.showModal()}
            >
              <Image
                src={qrSrc}
                alt={qr.alt}
                width={112}
                height={112}
                unoptimized
                onError={() => setImageFailed(true)}
              />
            </button>
            <p className="qr-caption">{qr.caption}</p>
            <a className="qr-save" href={qrSrc} download={qr.downloadFilename}>
              {qr.downloadLabel}
            </a>
            <dialog
              ref={dialogRef}
              className="qr-dialog"
              aria-labelledby="qr-dialog-title"
              onClick={(event) => {
                if (event.target === event.currentTarget)
                  dialogRef.current?.close();
              }}
            >
              <div className="qr-dialog-content">
                <button
                  className="dialog-close"
                  type="button"
                  aria-label="关闭二维码"
                  onClick={() => dialogRef.current?.close()}
                >
                  ×
                </button>
                <h2 id="qr-dialog-title">{qr.caption}</h2>
                <Image
                  src={qrSrc}
                  alt={qr.alt}
                  width={480}
                  height={480}
                  unoptimized
                  onError={() => setImageFailed(true)}
                />
                <p>{qr.mobileHint}</p>
                <a
                  className="primary-button"
                  href={qrSrc}
                  download={qr.downloadFilename}
                >
                  {qr.downloadLabel}
                </a>
              </div>
            </dialog>
          </>
        ) : (
          <div
            className="qr-placeholder"
            role="img"
            aria-label={`${qr.placeholderTitle}，${qr.placeholderStatus}`}
          >
            <span>{qr.placeholderTitle}</span>
            <span>{qr.placeholderStatus}</span>
          </div>
        )}
      </div>
    </section>
  );
}
