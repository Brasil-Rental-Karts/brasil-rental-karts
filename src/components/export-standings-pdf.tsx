import { Button } from "@/components/ui/button";
import { Download } from "lucide-react";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { PilotStanding } from "@/types/championship";
import { formatDate } from "@/lib/utils";

interface ExportStandingsPDFProps {
  championshipName: string;
  championshipLogo?: string | null;
  categoriesStandings: Record<string, PilotStanding[]>;
  categoryNames: Record<string, string>;
  leagueName: string;
}

interface ColorRGB {
  r: number;
  g: number;
  b: number;
}

export function ExportStandingsPDF({
  championshipName,
  championshipLogo,
  categoriesStandings,
  categoryNames,
  leagueName = "Brasil Rental Karts",
}: ExportStandingsPDFProps) {
  const handleExportPDF = async () => {
    try {
      // Criar PDF com orientação portrait conforme solicitado
      const pdf = new jsPDF({
        orientation: "portrait",
        unit: "mm",
        format: "a4",
      });
      
      const categoryIds = Object.keys(categoriesStandings);
      
      // Configurações para o documento
      pdf.setProperties({
        title: `Classificação - ${championshipName}`,
        author: "Brasil Rental Karts",
        creator: "Brasil Rental Karts",
      });
      
      // Definir cores da BRK
      const colors = {
        orange: { r: 255, g: 102, b: 0 },   // Laranja BRK
        black: { r: 0, g: 0, b: 0 },        // Preto
        white: { r: 255, g: 255, b: 255 },  // Branco
        lightGray: { r: 248, g: 248, b: 248 }, // Cinza mais claro para melhor contraste
        darkGray: { r: 80, g: 80, b: 80 }    // Cinza escuro para textos secundários
      };
      
      // Pré-carregar o logo da BRK uma vez fora do loop
      let brkLogoImg = null;
      try {
        const brkImg = new Image();
        brkImg.src = "/logo-brk-orginal.png"; // Logo local da pasta public
        await new Promise((resolve, reject) => {
          brkImg.onload = () => {
            brkLogoImg = brkImg;
            resolve(null);
          };
          brkImg.onerror = reject;
          // Timeout mais longo para garantir carregamento adequado
          setTimeout(resolve, 3000);
        });
      } catch (error) {
        console.error("Erro ao carregar logo da BRK:", error);
      }
      
      // Para cada categoria, criar uma página no PDF
      for (let i = 0; i < categoryIds.length; i++) {
        const categoryId = categoryIds[i];
        const categoryName = categoryNames[categoryId] || "Categoria";
        const standings = categoriesStandings[categoryId] || [];
        
        // Adicionar nova página, exceto para a primeira categoria
        if (i > 0) {
          pdf.addPage();
        }
        
        const pageWidth = pdf.internal.pageSize.getWidth();
        const pageHeight = pdf.internal.pageSize.getHeight();
        const margin = 15; // Margem padrão para todo o documento
        const contentWidth = pageWidth - (margin * 2);

        // Fundo branco limpo
        pdf.setFillColor(colors.white.r, colors.white.g, colors.white.b);
        pdf.rect(0, 0, pageWidth, pageHeight, 'F');
        
        // Área para o cabeçalho - reduzido pela metade
        const headerTopY = 10; // Posição Y reduzida

        // Logos com tamanho reduzido
        const brkLogoWidth = 20; // Reduzido (antes: 30)
        const brkLogoHeight = 16; // Reduzido (antes: 24)
        const brkLogoX = margin; // Posicionado na margem esquerda
        const brkLogoY = headerTopY;
        
        // Área para o logo do campeonato - também reduzido
        const champLogoWidth = 20; // Reduzido (antes: 30)
        const champLogoHeight = 16; // Reduzido (antes: 24)
        const champLogoX = pageWidth - champLogoWidth - margin;
        const champLogoY = headerTopY;
        
        // Adicionar o logo da BRK à ESQUERDA
        if (brkLogoImg) {
          try {
            pdf.addImage(brkLogoImg, "PNG", brkLogoX, brkLogoY, brkLogoWidth, brkLogoHeight);
          } catch (error) {
            console.error("Erro ao adicionar logo da BRK ao PDF:", error);
            simpleBrkLogo(pdf, brkLogoX, brkLogoY, brkLogoWidth, brkLogoHeight);
          }
        } else {
          simpleBrkLogo(pdf, brkLogoX, brkLogoY, brkLogoWidth, brkLogoHeight);
        }
        
        // Adicionar o logo do campeonato no lado direito
        if (championshipLogo) {
          try {
            const img = new Image();
            img.src = championshipLogo;
            await new Promise((resolve, reject) => {
              img.onload = resolve;
              img.onerror = reject;
              setTimeout(resolve, 2000);
            });
            
            // Posicionar o logo do campeonato à direita
            pdf.addImage(img, "PNG", champLogoX, champLogoY, champLogoWidth, champLogoHeight);
          } catch (error) {
            console.error("Erro ao adicionar logo do campeonato:", error);
            // Fallback para o logo do campeonato
            createChampionshipLogo(pdf, champLogoX, champLogoY, champLogoWidth, champLogoHeight, championshipName);
          }
        } else {
          // Sem logo do campeonato - criar um fallback visual
          createChampionshipLogo(pdf, champLogoX, champLogoY, champLogoWidth, champLogoHeight, championshipName);
        }
        
        // Espaço adequado abaixo dos logos - reduzido
        const contentStartY = headerTopY + brkLogoHeight + 5; // Reduzido (antes: +10)
        
        // Nome da liga em destaque com tipografia moderna - tamanho reduzido
        pdf.setFont("helvetica", "bold");
        pdf.setTextColor(colors.black.r, colors.black.g, colors.black.b);
        pdf.setFontSize(18); // Reduzido (antes: 24)
        // Centralizado entre os dois logos
        const centerX = pageWidth / 2;
        pdf.text(leagueName.toUpperCase(), centerX, contentStartY, { 
          align: 'center',
          maxWidth: contentWidth - (brkLogoWidth + champLogoWidth + 20)
        });
        
        // Linha decorativa abaixo do nome da liga - posição ajustada
        const lineY = contentStartY + 3; // Reduzido (antes: +5)
        // Desenhar uma linha laranja elegante
        pdf.setDrawColor(colors.orange.r, colors.orange.g, colors.orange.b);
        pdf.setLineWidth(0.8); // Mais fina
        pdf.line(margin + brkLogoWidth + 5, lineY, pageWidth - margin - champLogoWidth - 5, lineY);
        
        // Espaço adicional após a linha - reduzido
        const titleY = lineY + 10; // Reduzido (antes: +15)
        
        // Título do campeonato - tamanho reduzido
        pdf.setFont("helvetica", "bold");
        pdf.setTextColor(colors.black.r, colors.black.g, colors.black.b);
        pdf.setFontSize(16); // Reduzido (antes: 18)
        pdf.text(championshipName, centerX, titleY, { align: 'center' });
        
        // Nome da categoria - espaçamento mais compacto
        pdf.setFont("helvetica", "italic");
        pdf.setFontSize(12); // Reduzido (antes: 14)
        pdf.text(`Categoria: ${categoryName}`, centerX, titleY + 7, { align: 'center' }); // Reduzido (antes: +10)
        
        // Preparar dados da tabela
        const tableBody = standings.map((pilot) => {
          let position = pilot.position?.toString() || "-";
          return [
            position,
            pilot.pilot_name,
            pilot.total_points.toString()
          ];
        });
        
        // Aumentar o espaçamento antes da tabela para separar melhor do nome da categoria
        const tableStart = titleY + 20; // Aumentado (antes: +15)
        
        // Tabela com margens reduzidas e design compacto
        const tableMargin = 10; // Reduzido (antes: 15)
        
        // Barra de título com altura reduzida - alinhada com a tabela
        const tableHeaderY = tableStart - 7; // Ajustado
        const tableHeaderHeight = 6; // Reduzido (antes: 8) - header mais fino
        
        // Usar retângulo para o cabeçalho da tabela - ALINHADO COM A TABELA
        pdf.setFillColor(colors.orange.r, colors.orange.g, colors.orange.b);
        // Usar tableMargin em vez de margin para alinhar com a tabela
        pdf.rect(tableMargin, tableHeaderY, pageWidth - (tableMargin * 2), tableHeaderHeight, "F");
        
        // Texto do cabeçalho da tabela - ajustado para centralizar melhor no retângulo mais fino
        pdf.setTextColor(colors.white.r, colors.white.g, colors.white.b);
        pdf.setFont("helvetica", "bold");
        pdf.setFontSize(11); // Reduzido um pouco mais
        pdf.text("Classificação", pageWidth / 2, tableHeaderY + 4.5, { align: "center" }); // Ajustado para centralizar no retângulo mais fino
        
        // Tabela com design compacto
        autoTable(pdf, {
          startY: tableStart,
          margin: { left: tableMargin, right: tableMargin }, // Margens reduzidas
          head: [["Pos.", "Piloto", "Pontos"]],
          body: tableBody,
          theme: "grid",
          headStyles: {
            fillColor: [0, 0, 0],
            textColor: [255, 255, 255],
            fontStyle: "bold",
            halign: "center",
            fontSize: 10, // Reduzido (antes: 11)
            cellPadding: 2, // Reduzido (antes: 5)
          },
          alternateRowStyles: {
            fillColor: [248, 248, 248],
          },
          styles: {
            fontSize: 10, // Reduzido (antes: 11)
            cellPadding: 3, // Reduzido (antes: 4)
            lineWidth: 0.1,
            lineColor: [200, 200, 200],
            textColor: [50, 50, 50],
            font: "helvetica",
          },
          columnStyles: {
            0: { 
              cellWidth: 15, // Reduzido (antes: 20)
              halign: "center",
              fontStyle: "bold"
            },
            1: { 
              cellWidth: 'auto',
            },
            2: { 
              cellWidth: 25, // Reduzido (antes: 30)
              halign: "center",
              fontStyle: "bold"
            }
          },
          didDrawCell: (data) => {
            // Destacar células de pontuação para os três primeiros com efeito moderno
            if (data.section === 'body' && data.column.index === 2 && data.row.index < 3) {
              // Usar cores mais vivas para destacar
              const highlightColors = [
                {r: 255, g: 102, b: 0},  // 1º lugar - laranja BRK
                {r: 255, g: 130, b: 50}, // 2º lugar - laranja mais claro
                {r: 255, g: 160, b: 80}  // 3º lugar - laranja ainda mais claro
              ];
              
              const color = highlightColors[data.row.index];
              pdf.setTextColor(color.r, color.g, color.b);
              pdf.setFont("helvetica", "bold");
              pdf.text(
                data.cell.text[0],
                data.cell.x + data.cell.width / 2,
                data.cell.y + data.cell.height / 2 + 1,
                { align: "center" }
              );
              
              // Adicionar um indicador sutil de pódio para o primeiro lugar
              if (data.row.index === 0) {
                // Destacar com um pequeno círculo dourado
                pdf.setFillColor(255, 215, 0); // Dourado
                pdf.circle(data.cell.x + 3, data.cell.y + 3, 1.5, 'F');
              }
            }
          },
        });
        
        // Rodapé - ajustado para usar menos espaço
        const footerY = pageHeight - 10; // Reduzido (antes: -15)
        pdf.setDrawColor(colors.orange.r, colors.orange.g, colors.orange.b);
        pdf.setLineWidth(0.3); // Mais fino (antes: 0.5)
        pdf.line(tableMargin, footerY, pageWidth - tableMargin, footerY);
        
        // Informações do rodapé compactadas
        pdf.setFont("helvetica", "italic");
        pdf.setFontSize(7); // Reduzido (antes: 8)
        pdf.setTextColor(colors.darkGray.r, colors.darkGray.g, colors.darkGray.b);
        pdf.text("Brasil Rental Karts - Classificação Oficial", tableMargin, pageHeight - 5); // Ajustado
        
        // Número da página
        const pageInfo = `Página ${i + 1} de ${categoryIds.length}`;
        pdf.text(pageInfo, pageWidth - tableMargin - pdf.getTextWidth(pageInfo), pageHeight - 5); // Ajustado
      }
      
      // Salvar o PDF
      pdf.save(`Classificacao_${championshipName.replace(/\s+/g, "_")}.pdf`);
    } catch (error) {
      console.error("Erro ao gerar PDF:", error);
      alert("Erro ao gerar o PDF. Por favor, tente novamente.");
    }
  };

  // Função de fallback para o logo da BRK com design moderno
  const simpleBrkLogo = (pdf: jsPDF, x: number, y: number, width: number, height: number) => {
    // Desenhar um retângulo laranja
    pdf.setFillColor(255, 102, 0);
    pdf.rect(x, y, width, height, 'F');
    
    // Adicionar o texto "BRK" em branco com posicionamento melhorado
    pdf.setTextColor(255, 255, 255);
    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(14);
    
    // Centralizar texto no retângulo
    const textWidth = pdf.getTextWidth("BRK");
    const textX = x + (width - textWidth) / 2;
    const textY = y + height / 2 + 2;
    
    pdf.text("BRK", textX, textY);
  };

  // Função para criar uma representação visual do logo do campeonato
  const createChampionshipLogo = (pdf: jsPDF, x: number, y: number, width: number, height: number, championshipName: string) => {
    // Desenhar um retângulo laranja
    pdf.setFillColor(255, 102, 0);
    pdf.rect(x, y, width, height, 'F');
    
    // Pegar a primeira letra do nome do campeonato
    const initial = championshipName.charAt(0).toUpperCase();
    
    // Adicionar a letra em branco
    pdf.setTextColor(255, 255, 255);
    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(16);
    
    // Centralizar texto
    const textWidth = pdf.getTextWidth(initial);
    const textX = x + (width - textWidth) / 2;
    const textY = y + height / 2 + 4;
    
    pdf.text(initial, textX, textY);
  };

  return (
    <Button 
      variant="outline" 
      size="sm" 
      onClick={handleExportPDF} 
      className="gap-1"
    >
      <Download className="h-4 w-4" />
      Exportar PDF
    </Button>
  );
} 