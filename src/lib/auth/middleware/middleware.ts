import { NextRequest, NextResponse } from 'next/server';
import { handleAuthProtection } from './middleware.auth';
import { handleNoIndex } from './middleware.noindex';
import { handleValidpageRedirect } from './middleware.validpage';
import { handleFingerprint } from './middleware.fingerprint';

export async function middleware(request: NextRequest) {

  // set log in middleware
  const response = NextResponse.next();
  const url = new URL(request.url);
  const pathname = url.pathname.toString();

  // Set cookies for fingerprint and viewport
  // handleFingerprint(request, response);

  // Allow static file extensions
  if (/\.(xml|json|txt|jpg|png|svg|ico)$/i.test(pathname)) {
    return response;
  }

  // Add x-robots-tag for noindex rules
  handleNoIndex(request, response);
  // Add finger-print
  handleFingerprint(request, response);
  // Handle 410 Gone paths
  // const goneRes = await handleGonePaths(request);
  // if (goneRes) return goneRes;

  // Redirect unauthorized users from protected routes
  const authRes = await handleAuthProtection(request);
  if (authRes) return authRes;
  
  const validpage = await handleValidpageRedirect(request)
  if (validpage) return validpage;
  // Redirect unknown slugs to /mag/{id} if exists
  // const magRes = await handleMagRedirect(request);
  // if (magRes) return magRes;

  return response;
}




// import { NextRequest, NextResponse, userAgent } from 'next/server';
// import { getToken } from '../token';
// import { BASEURL } from '../variable';
// // import { BASEURL } from "../variable";

// const pages =[""]

// function generateUniqueToken(length = 82) {
//   const characters =
//     'ABC2343423423DEFGHIJKLMNOPQR2351235STUVWX68757656545YZabcdefghijklmnopqrstuvwxyz0123456789';
//   let token = '';

//   for (let i = 0; i < length; i++) {
//     const randomIndex = Math.floor(Math.random() * characters.length);
//     token += characters[randomIndex];
//   }

//   return token;
// }

// const protectedRoute = ['/checkout', '/address', '/admin', '/profile'];

// export async function middleware(request: NextRequest) {
//   const rawSession = request.cookies.get(process.env.NEXT_PUBLIC_COCKIES!)?.value;
//   const finger = request.cookies.get('finger')?.value;
//   const response = NextResponse.next();
//   const pathname = new URL(request.url).pathname;
//   const { device } = userAgent(request);
//   const viewport = device.type === 'mobile' ? 'mobile' : 'desktop';

//   // check product redirect
//   const productMatch = pathname.startsWith('/product');
//   const idProduct = pathname.split('/')[2];
//   const idPage = pathname.split('/')[1];
//   const isId = /^\d+$/.test(idProduct);
//   const isIdPage = /^\d+$/.test(idPage);

//   // اگر فینگرفینگر کوکی موجود نیست، یک توکن جدید بساز
//   if (!finger) {
//     const generateFinger = generateUniqueToken();
//     response.cookies.set({
//       name: 'finger',
//       value: generateFinger,
//       maxAge: 1000 * 24 * 60 * 60,
//       expires: 1000 * 24 * 60 * 60,
//     });
//   }

//   response.cookies.set({
//     name: 'viewport',
//     value: viewport,
//     maxAge: 1000 * 24 * 60 * 60,
//     expires: 1000 * 24 * 60 * 60,
//   });
//   // custom file has access
//   if (/\.(xml|json|txt|jpg|png|svg|ico)$/i.test(pathname)) {
//     return response;
//   }

//   // stage need token
//   // if (process.env.APP_ENV === "stage" && !rawSession)
//   //   return redirectToSignIn(request);

//   const isProtectedRoute = protectedRoute.find((page) => pathname.startsWith(page));

//   if (productMatch && !isId) {
//     const token = await getToken();
//     const response = await fetch(
//       `${BASEURL}/catalog/product/${idProduct}?slug=/product/${decodeURIComponent(idProduct)}/`,
//       {
//         headers: {
//           'Content-Type': 'application/json',
//           Accept: 'application/json',
//           Authorization: `Bearer ${token}`,
//         },
//       }
//     );

//     const result = await response.json();

//     if (result?.id) {
//       const redirectUrl = new URL(`/product/${result.id}`, request.url); // 👈 اصلاح‌شده
//       return NextResponse.redirect(redirectUrl, 301);
//     }
//   }

//   if (isIdPage) {
//     const redirectUrl = new URL(`/`, request.url); // 👈 اصلاح‌شده
//     return NextResponse.redirect(redirectUrl, 301);
//   }

//   const match = pathname.startsWith('/product-category');
//     const isProducts = pathname.startsWith('/products');

//   if (match) {
//     const urls = pathname.split('/');
//     const newUrl = new URL(
//       `/category/${urls[2]}?slug=${decodeURIComponent(pathname)}`,
//       request.url
//     );
//     return NextResponse.redirect(newUrl, 301);
//   }


//   // اگر روت محافظت شده هست و سشن موجود نیست، ریدایرکت به صفحه ورود
//   if (!rawSession && isProtectedRoute) {
//     return redirectToSignIn(request);
//   }

//     if (isProducts) {
//     const urls = pathname.split('/');
//     const newUrl = new URL(
//       `/product/${urls[2]}`,
//       request.url
//     );
//     return NextResponse.redirect(newUrl, 301);
//   }

//   // // بررسی مسیرهای موجود در آرایه pages
//   // const isAllowedPage = pages.some(
//   //   (page) => pathname === page || pathname.startsWith(page + "/")
//   // );

//   // if (!isAllowedPage) {
//   //   // چک می‌کنیم که آیا مسیر فعلی از نوع /mag/{id} هست یا نه تا از ایجاد لوپ جلوگیری کنیم
//   //   if (!pathname.startsWith("/mag/")) {
//   //     const pathParts = pathname.split("/").filter(Boolean);
//   //     const newUrl = new URL(request.url);
//   //     const result = await fetch(`${BASEURL}/user/mag/${pathParts[0]}`, {
//   //       headers: headers,
//   //     });
//   //     if (result.status !== 404) {
//   //       newUrl.pathname = `/mag/${pathParts[0]}`; // ریدایرکت به /mag/{id}
//   //       return NextResponse.redirect(newUrl);
//   //     }
//   //   }
//   // }

//   return response;
// }

// function redirectToSignIn(request: NextRequest) {
//   const prevPage = new URL(request.url).pathname;
//   const url = new URL(request.url);

//   url.pathname = '/auth';
//   url.searchParams.set('page', prevPage); // ✅ اضافه کردن پارامتر صفحه قبلی

//   const response = NextResponse.redirect(url.toString());
//   response.cookies.delete(process.env.NEXT_PUBLIC_COCKIES!);

//   return response;
// }

