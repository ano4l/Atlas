export const lightTheme = {
  isDark: false, bg: "#ECECE7", paper: "#FFFEFB", ink: "#151817", muted: "#626B68",
  subtle: "#E8E9E3", line: "#CDD1C8", map: "#D9DAD3", room: "#ECEDE8",
  route: "#567D00", routeSoft: "#DDF5A9", sage: "#27795A", amber: "#A96600",
  amberSoft: "#FFF0D3", danger: "#B43B32", shadow: "#111827",
};
export type Theme = typeof lightTheme;
export const darkTheme: Theme = {...lightTheme,isDark:true,bg:"#111412",paper:"#1B1F1D",ink:"#F7F8F3",muted:"#AEB7B1",subtle:"#252A27",line:"#38413B",map:"#151917",room:"#252B27",route:"#B8FF2C",routeSoft:"#35520D",sage:"#66D69A",amber:"#F2B44C",amberSoft:"#44351E",danger:"#A8322D",shadow:"#000000"};
export const space={xs:4,sm:8,md:12,lg:16,xl:24,xxl:32}; export const radius={sm:10,md:16,lg:24,sheet:28};
