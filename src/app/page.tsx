import Hero from "@/components/sections/Hero";
import PilotosBarpran from "@/components/sections/PilotosBarpran";
import Manifesto from "@/components/sections/Manifesto";
import Engineering from "@/components/sections/Engineering";
import Motorsport from "@/components/sections/Motorsport";
import Products from "@/components/sections/Products";
import Manufacturing from "@/components/sections/Manufacturing";
import ReparacionesEstandar from "@/components/sections/ReparacionesEstandar";
import History from "@/components/sections/History";
import Shop from "@/components/sections/Shop";
import Contact from "@/components/sections/Contact";
import ScrollProgress from "@/components/ui/ScrollProgress";
import AplicacionesEspeciales from "@/components/sections/AplicacionesEspeciales";

export default function Home() {
  return (
    <>
      <ScrollProgress />
      <Hero />
      <PilotosBarpran />
      <Manifesto />
      <Engineering />
      <Motorsport />
      <Products />
      <ReparacionesEstandar />
      <Manufacturing />
      <History />
      <Shop />
      <AplicacionesEspeciales />
      <Contact />
    </>
  );
}
