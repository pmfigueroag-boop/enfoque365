"use client";

import { useEffect, useState, useRef } from "react";
import { api } from "../../lib/api";
import { useToast } from "../../components/Toast";
import InfographicPestel from "../pestel/InfographicPestel";
import InfographicPorter from "../porter/InfographicPorter";
import InfographicVrio from "../vrio/InfographicVrio";
import InfographicMcKinsey from "../mckinsey7s/InfographicMcKinsey";
import InfographicBcg from "../bcg/InfographicBcg";
import InfographicFoda from "../foda/InfographicFoda";
import InfographicTows from "../tows/InfographicTows";
import InfographicP2W from "../../formulacion/p2w/InfographicP2W";
import InfographicKernel from "../../formulacion/kernel/InfographicKernel";
import InfographicBlueOcean from "../../formulacion/blue-ocean/InfographicBlueOcean";

export default function ReportePage() {
  const { toast } = useToast();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const reportRef = useRef<HTMLDivElement>(null);
  const [isExporting, setIsExporting] = useState(false);

  useEffect(() => {
    async function loadAll() {
      try {
        const [pestel, porter, vrio, mckinsey, bcg, foda, tows, blueOcean, p2w, kernel] = await Promise.all([
          api.getPestel().catch(() => []),
          api.getPorter().catch(() => []),
          api.getVrio().catch(() => []),
          api.getMckinsey7s().catch(() => []),
          api.getBcg().catch(() => []),
          api.getFoda().catch(() => []),
          api.getTows().catch(() => []),
          api.getBlueOcean().catch(() => []),
          api.getP2w().catch(() => []),
          api.getKernel().catch(() => [])
        ]);
        setData({ pestel, porter, vrio, mckinsey, bcg, foda, tows, blueOcean, p2w, kernel });
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    }
    loadAll();
  }, []);

  const handleExportPDF = async () => {
    if (!reportRef.current) return;
    setIsExporting(true);
    toast.info("Generando PDF, por favor espera...");

    try {
      // @ts-ignore
      const html2pdf = (await import("html2pdf.js")).default;

      const element = reportRef.current;
      const opt = {
        margin:       10,
        filename:     'Reporte_Estrategico_Enfoque365.pdf',
        image:        { type: 'jpeg', quality: 0.98 },
        html2canvas:  { scale: 2, useCORS: true, logging: false },
        jsPDF:        { unit: 'mm', format: 'a4', orientation: 'portrait' }
      };

      await html2pdf().set(opt).from(element).save();
      toast.success("PDF generado exitosamente.");
    } catch (error) {
      console.error(error);
      toast.error("Error al generar el PDF.");
    } finally {
      setIsExporting(false);
    }
  };

  if (loading) {
    return <div className="page-content">Cargando datos para el reporte...</div>;
  }

  return (
    <>
      <header className="header" style={{ marginBottom: "20px" }}>
        <div>
          <h2 className="header-title">Reporte Ejecutivo Integral</h2>
          <p style={{ color: "var(--text-muted)", fontSize: "0.9rem" }}>Consolidación de matrices y diagnósticos para presentación.</p>
        </div>
        <button 
          className="btn btn-primary" 
          onClick={handleExportPDF} 
          disabled={isExporting}
          style={{ background: isExporting ? "var(--text-muted)" : "linear-gradient(135deg, #10b981, #059669)", fontWeight: 700 }}
        >
          {isExporting ? "Generando..." : "Descargar PDF"}
        </button>
      </header>

      {/* Container visible en web, y también es lo que se exporta a PDF */}
      <div className="page-content" style={{ background: "#fff", padding: "20px", borderRadius: "12px", color: "#000" }}>
        
        {/* Usamos una capa contenedora que se pasará a html2pdf */}
        <div ref={reportRef} style={{ background: "var(--bg-primary)", color: "var(--text-primary)", padding: "20px", minHeight: "100%" }}>
          
          <div style={{ textAlign: "center", marginBottom: "40px" }}>
            <h1 style={{ fontSize: "2.5rem", fontWeight: 900, marginBottom: "10px", background: "linear-gradient(90deg, #6366f1, #ec4899)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
              Enfoque365
            </h1>
            <h2 style={{ fontSize: "1.5rem", color: "var(--text-secondary)" }}>Reporte de Diagnóstico Estratégico</h2>
            <p style={{ color: "var(--text-muted)", marginTop: "10px" }}>{new Date().toLocaleDateString()}</p>
          </div>

          {/* Salto de página para PDF */}
          <div className="html2pdf__page-break"></div>

          <div style={{ marginBottom: "40px" }}>
            <InfographicPestel data={data.pestel} />
          </div>

          <div className="html2pdf__page-break"></div>

          <div style={{ marginBottom: "40px" }}>
            <InfographicPorter data={data.porter} />
          </div>

          <div className="html2pdf__page-break"></div>

          <div style={{ marginBottom: "40px" }}>
            <InfographicVrio data={data.vrio} />
          </div>

          <div className="html2pdf__page-break"></div>

          <div style={{ marginBottom: "40px" }}>
            <InfographicMcKinsey data={data.mckinsey} />
          </div>

          <div className="html2pdf__page-break"></div>

          <div style={{ marginBottom: "40px" }}>
            <InfographicBcg data={data.bcg} />
          </div>

          <div className="html2pdf__page-break"></div>

          <div style={{ marginBottom: "40px" }}>
            <InfographicFoda data={data.foda} />
          </div>

          <div className="html2pdf__page-break"></div>

          <div style={{ marginBottom: "40px" }}>
            <InfographicTows data={data.tows} />
          </div>

          <div className="html2pdf__page-break"></div>

          <div style={{ marginBottom: "40px" }}>
            <InfographicP2W data={data.p2w} />
          </div>

          <div className="html2pdf__page-break"></div>

          <div style={{ marginBottom: "40px" }}>
            <InfographicKernel data={data.kernel} />
          </div>

          <div className="html2pdf__page-break"></div>

          <div style={{ marginBottom: "40px" }}>
            <InfographicBlueOcean data={data.blueOcean} />
          </div>

        </div>
      </div>
    </>
  );
}
