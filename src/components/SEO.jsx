import { useEffect } from 'react';

export default function SEO({ title, description = 'Madan Mohan and Sons - Your Trusted Retail Partner' }) {
  useEffect(() => {
    document.title = title ? `${title} | MMS` : 'Madan Mohan and Sons';

    let metaDesc = document.querySelector('meta[name="description"]');
    if (!metaDesc) {
      metaDesc = document.createElement('meta');
      metaDesc.name = 'description';
      document.head.appendChild(metaDesc);
    }
    metaDesc.setAttribute('content', description);
  }, [title, description]);

  return null;
}
