// export const jsonLdMags = {
//     '@context': 'https://schema.org',
//     '@graph': [
//         {
//             '@type': 'Organization',
//             '@id': 'https://toctam.com/#organization',
//             name: 'تکنم',
//             url: 'https://toctam.com',
//         },
//         {
//             '@type': 'WebSite',
//             '@id': 'https://toctam.com/#website',
//             url: 'https://toctam.com',
//             name: 'تکنم',
//             publisher: {
//                 '@id': 'https://toctam.com/#organization',
//             },
//             inLanguage: 'fa-IR',
//         },
//         {
//             '@type': 'BreadcrumbList',
//             '@id': 'https://toctam.com/mag/#breadcrumb',
//             itemListElement: [
//                 {
//                     '@type': 'ListItem',
//                     position: 1,
//                     item: {
//                         '@id': 'https://toctam.com',
//                         name: 'خانه',
//                     },
//                 },
//             ],
//         },
//         {
//             '@type': 'CollectionPage',
//             '@id': 'https://toctam.com/mag/#webpage',
//             url: 'https://toctam.com/mag/',
//             name: ' بلاگ |  تکتم',
//             isPartOf: {
//                 '@id': 'https://toctam.com/#website',
//             },
//             inLanguage: 'fa-IR',
//             breadcrumb: {
//                 '@id': 'https://toctam.com/mag/#breadcrumb',
//             },
//         },
//     ],
// }

// export const generateJsonldProduct = ()=>{
//  return {
//     '@context': 'https://schema.org',
//     '@graph': [
//         {
//             '@type': 'Organization',
//             '@id': 'https://tactom.com/#organization',
//             name: 'تکتم',
//             url: 'https://tactom.com',
//         },
//         {
//             '@type': 'WebSite',
//             '@id': 'https://tactom.com/#website',
//             url: 'https://tactom.com',
//             name: 'تکتم',
//             publisher: {
//                 '@id': 'https://tactom.com/#organization',
//             },
//             inLanguage: 'fa-IR',
//         },
//         {
//             '@type': 'ImageObject',
//             '@id': `http://localhost:3000/imgurl`,
//             url: `http://localhost:3000/imgurl`,
//             width: '1000',
//             height: '1000',
//             inLanguage: 'fa-IR',
//         },
//         {
//             '@type': 'BreadcrumbList',
//             '@id': `https://tactom.com/product/${"url-product"}/#breadcrumb`,
//             itemListElement: [].map(
//                 (item: any, idx: number) => {
//                     return {
//                         '@type': 'ListItem',
//                         position: idx + 1,
//                         item: {
//                             '@id': item?.url,
//                             name: item?.title,
//                         },
//                     }
//                 },
//             ),
//         },
//         {
//             '@type': 'ItemPage',
//             '@id': `https://tactom.com/product/${"product?.url"}/#webpage`,
//             url: `https://tactom.com/product/${"product?.url"}/`,
//             name: "product?.title",
//             datePublished: "product?.createdAt",
//             dateModified: "product?.updatedAt",
//             isPartOf: {
//                 '@id': 'https://tactom.com/#website',
//             },
//             primaryImageOfPage: {
//                 '@id': `http://localhost:3000/${"product?.thumbnailImage?.url"}`,
//             },
//             inLanguage: 'fa-IR',
//             breadcrumb: {
//                 '@id': `https://tactom.com/product/${"product?.url"}/#breadcrumb`,
//             },
//         },
//         {
//             '@type': 'Product',
//             ...(true
//                 ? {
//                       brand: {
//                           '@type': 'Brand',
//                           name: "findBrand?.title",
//                       },
//                   }
//                 : null),
//             name: "product?.metaTitle",
//             description: "product?.metaDescription",
//             sku:" product?.skuId",
//             category: "product?.category?.metaTitle",
//             mainEntityOfPage: {
//                 '@id': `https://tactom.com/product/${"product?.url"}/#webpage`,
//             },
//             image: []?.map((item) => {
//                 return {
//                     '@type': 'ImageObject',
//                     url: `http://localhost:3000/${"item?.thumbnailImage?.url"}`,
//                     height: '1000',
//                     width: '1000',
//                 }
//             }),
//             offers: {
//                 '@type': 'Offer',
//                 price: "product?.price",
//                 priceCurrency: 'IRT',
//                 priceValidUntil: "product?.discountTime"?.split(' ')[1],
//                 availability: 'https://schema.org/InStock',
//                 url: `https://tactom.com/product/${"product?.url"}/`,
//                 seller: {
//                     '@type': 'Organization',
//                     '@id': 'https://tactom.com/',
//                     name: 'تکتم',
//                     url: 'https://tactom.com',
//                     logo: '',
//                 },
//             },
//             additionalProperty: []?.map((item) => {
//                 return {
//                     '@type': 'PropertyValue',
//                     name: "item?.title",
//                     value: "item.attribiuts[0]?.title",
//                 }
//             }),
//         },
//     ],
// }
// }

// export const jsonLd = {
//     '@context': 'https://schema.org',
//     '@graph': [
//         {
//             '@type': 'Organization',
//             '@id': 'https://toctam.com/#organization',
//             name: 'تکتم',
//         },
//         {
//             '@type': 'WebSite',
//             '@id': 'https://toctam.com/#website',
//             url: 'https://toctam.com',
//             name: 'تکتم',
//             publisher: {
//                 '@id': 'https://toctam.com/#organization',
//             },
//             inLanguage: 'fa-IR',
//         },
//         {
//             '@type': 'BreadcrumbList',
//             '@id': `https://toctam.com/product-category/${"filters?.data?.category[0]?.url"}/#breadcrumb`,
//             itemListElement: [
//                 ..."filters.data.category[0]?.breadcrumbs",
//                 {
//                     id: '1',
//                     title: "filters.data.category[0].title",
//                     url: '#',
//                 },
//             ].map((item, idx) => {
//                 return {
//                     '@type': 'ListItem',
//                     position: idx + 1,
//                     item: {
//                         '@id': 'https://toctam.com',
//                         name: "item.title",
//                     },
//                 }
//             }),
//         },
//         {
//             '@type': 'CollectionPage',
//             '@id': `https://toctam.com/product-category/${"filters?.data?.category[0].url"}/#webpage`,
//             url: `https://toctam.com/product-category/${"filters?.data?.category[0].url"}/`,
//             name: "filters?.data?.category[0].metaTitle",
//             isPartOf: {
//                 '@id': 'https://toctam.com/#website',
//             },
//             inLanguage: 'fa-IR',
//             breadcrumb: {
//                 '@id': `https://toctam.com/product-category/${"filters?.data?.category[0].url"}/#breadcrumb`,
//             },
//         },
//     ],
// }
