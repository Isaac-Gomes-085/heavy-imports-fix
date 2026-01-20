// REGRAS DE BLOQUEIO (NÃO DYNAMIC)

export const FORBIDDEN_SOURCES = [
  // React core
  "react",
  "react-dom",
  "react/jsx-runtime",
  "react/jsx-dev-runtime",

  // Next.js core
  "next",
  "next/app",
  "next/document",
  "next/head",
  "next/image",
  "next/link",
  "next/router",
  "next/navigation",
  "next/script",
  "next/font",
  "next/font/google",

  // State / data
  "react-query",
  "@tanstack/react-query",
  "redux",
  "@reduxjs/toolkit",
  "react-redux",
  "zustand",
  "jotai",
  "recoil",
  "mobx",
  "mobx-react",
  "swr",

  // HTTP / side effects
  // "axios",
  "ky",
  "cross-fetch",

  // Utils
  // "lodash",
  "lodash-es",
  "date-fns-tz",
  "date-fns",
  "ramda",
  "uuid",
  "clsx",
  "classnames",
  "zod",
  "yup",
  "joi",

  // Node
  "fs",
  "path",
  "crypto",
  "os",
  "stream",
  "buffer",
  "util",

  // Polyfills
  "core-js",
  "regenerator-runtime",
];

export const FORBIDDEN_LOCAL_NAME_REGEX = [
  /^use[A-Z]/,     // hooks (useState, useEffect...)
  /Event$/,        // ChangeEvent, MouseEvent
  /Props$/,        // ComponentProps
  /State$/,        // State
  /Ref$/,          // Ref
  /^React/,        // ReactNode, ReactElement
];

export const FORBIDDEN_EXTENSIONS = [
  ".css",
  ".scss",
  ".sass",
  ".less",
  ".svg",
];

export const FORBIDDEN_NAMED_EXPORTS: string[] = [

];

export const heavyLibs = [
  "recharts",
  "react-chartjs-2",
  "chart.js",
  "echarts",
  "echarts-for-react",
  "victory",
  "nivo",
  "d3",
  "d3-*",
  "@mui/material",
  "@mui/icons-material",
  "antd",
  "semantic-ui-react",
  "primereact",
  "rsuite",
  "blueprintjs",
  "@chakra-ui/react",
  "react-big-calendar",
  "@fullcalendar/react",
  "@fullcalendar/core",
  "@fullcalendar/daygrid",
  "@fullcalendar/timegrid",
  "@fullcalendar/interaction",
  "moment",
  "moment-timezone",
  "luxon",
  "formik",
  "redux-form",
  "draft-js",
  "slate",
  "slate-react",
  "quill",
  "react-quill",
  "ckeditor4-react",
  "@ckeditor/ckeditor5-react",
  "redux",
  "@reduxjs/toolkit",
  "mobx",
  "mobx-react",
  "apollo-client",
  "@apollo/client",
  "leaflet",
  "react-leaflet",
  "mapbox-gl",
  "react-map-gl",
  "@heroicons/react",
  "react-icons",
  // "lodash",
  // "lodash-es",
  // "rxjs",
  "pdfjs-dist",
  "react-pdf",
  "video.js",
  "react-player",
  "three",
  "@react-three/fiber",
];

// libs que são utilitarias 

export const UTILITY_LIBS = [
  "moment",
  "moment-timezone",
  "lodash",
  "lodash-es",
  "rxjs",
  "luxon",
  "axios",
  // "date-fns",
  // "date-fns-tz"
];

// libs que precisão de tipagem
export const LIBS_REQUIRING_ANY: string[] = [];
