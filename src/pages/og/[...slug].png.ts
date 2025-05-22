import { getCollection, getEntry } from 'astro:content';
import { ImageResponse } from '@vercel/og';
import { getRootPages } from '@lib/getRootPages';
import siteConfig from '@util/themeConfig';
import { type AllContent } from '../../types/content';

export const config = {
  runtime: 'edge',
};

interface Props {
  params: { slug: string };
}

async function loadFont(url: string) {
  const res = await fetch(url);
  return res.arrayBuffer();
}

function getImageUrl(entry: AllContent) {
  return entry?.data?.image?.src ?? '/default-listing-image.png';
}

export async function GET({ params }: Props) {
  try {
    const title = siteConfig.general.title;
    const { slug } = params;

    let entry: AllContent | undefined;
    const allListings = (await getCollection("directory")).map(e => e.id);

    entry = allListings.includes(slug)
      ? await getEntry('directory', slug)
      : await getEntry('pages', slug);

    if (!entry) {
      return new Response('Not found', { status: 404 });
    }

    const [boldFont, regularFont] = await Promise.all([
      loadFont(new URL('../../../node_modules/@fontsource/gabarito/files/gabarito-latin-700-normal.woff', import.meta.url).toString()),
      loadFont(new URL('../../../node_modules/@fontsource/gabarito/files/gabarito-latin-400-normal.woff', import.meta.url).toString()),
    ]);

    const imageUrl = getImageUrl(entry);
    const image = {
      type: 'img',
      props: {
        src: imageUrl,
        tw: 'w-[200px] h-[200px] object-cover rounded-3xl',
      },
    };

    const html = {
      type: 'div',
      props: {
        children: [
          {
            type: 'div',
            props: {
              tw: 'w-[200px] h-[200px] flex rounded-3xl overflow-hidden',
              children: [image],
            },
          },
          {
            type: 'div',
            props: {
              tw: 'pl-10 shrink flex flex-col max-w-xl',
              children: [
                {
                  type: 'div',
                  props: {
                    tw: 'text-zinc-800',
                    style: {
                      fontSize: '48px',
                      fontFamily: 'Gabarito Bold',
                    },
                    children: entry.data.title,
                  },
                },
                {
                  type: 'div',
                  props: {
                    tw: 'text-zinc-500 mt-2',
                    style: {
                      fontSize: '18px',
                      fontFamily: 'Gabarito Regular',
                    },
                    children:
                      entry.collection === 'directory'
                        ? entry.data.description
                        : entry.data.title,
                  },
                },
              ],
            },
          },
          {
            type: 'div',
            props: {
              tw: 'absolute right-[40px] bottom-[40px] flex items-center',
              children: [
                {
                  type: 'div',
                  props: {
                    tw: 'text-gray-900 text-4xl',
                    style: {
                      fontFamily: 'Gabarito Bold',
                    },
                    children: `${title}`,
                  },
                },
              ],
            },
          },
        ],
        tw: 'w-full h-full flex items-center justify-center relative px-22',
        style: {
          background: '#fff',
          fontFamily: 'Gabarito Regular',
        },
      },
    };

    return new ImageResponse(html, {
      width: 1200,
      height: 600,
      fonts: [
        {
          name: 'Gabarito Bold',
          data: boldFont,
          style: 'normal',
        },
        {
          name: 'Gabarito Regular',
          data: regularFont,
          style: 'normal',
        },
      ],
    });
  } catch (err) {
    console.error('OG image generation failed:', err);
    return new Response('Failed to generate image', { status: 500 });
  }
}

export async function getStaticPaths() {
  return await getRootPages(false);
}