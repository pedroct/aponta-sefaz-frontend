import React, { useState } from "react";
import { ModalAdicionarTempo } from "@/components/custom/ModalAdicionarTempo";
import { Clock, MessageSquare, Tag, Users, MoreHorizontal, ChevronDown, Check } from "lucide-react";
import { cn } from "@/lib/utils";

export default function DetalheTarefa() {
  const [isModalOpen, setIsModalOpen] = useState(false);

  return (
    <div className="min-h-screen bg-[#FAF9F8] font-['Segoe_UI',_Tahoma,_Geneva,_Verdana,_sans-serif]">
      {/* Barra Superior Fake do ADO */}
      <div className="h-10 bg-[#0078D4] w-full flex items-center px-4 text-white text-xs gap-4">
         <span className="font-bold">Azure DevOps</span>
         <span className="opacity-80">Boards / Backlogs</span>
      </div>

      <div className="p-6 max-w-6xl mx-auto">
         {/* Container principal imitando a Modal do Work Item */}
         <div className="bg-white shadow-xl rounded-sm border border-[#C8C6C4] flex flex-col min-h-[600px]">
            {/* Header do Work Item */}
            <div className="px-6 py-4 border-b border-[#EAEAEA] flex items-center justify-between">
               <div className="flex flex-col">
                  <div className="flex items-center gap-2 text-xs text-[#605E5C]">
                     <span className="px-1.5 py-0.5 bg-[#FFF4CE] text-[#8A6900] rounded-sm font-bold flex items-center gap-1">
                        📋 TASK 5
                     </span>
                     <span>/ DEV / Boards / Backlogs</span>
                  </div>
                  <h1 className="text-xl font-semibold text-[#201F1E] mt-1">C02. Documentação do Projeto</h1>
               </div>
               <div className="flex items-center gap-2">
                  <button className="px-3 py-1.5 text-xs border border-[#C8C6C4] rounded-sm hover:bg-[#F3F2F1] text-[#201F1E] flex items-center gap-1.5">
                     <Save size={14} className="text-[#605E5C]" />
                     Save and Close
                  </button>
                  <button className="px-3 py-1.5 text-xs bg-[#0078D4] text-white rounded-sm hover:bg-[#106EBE] flex items-center gap-1">
                     Follow
                     <ChevronDown size={14} />
                  </button>
                  <button className="p-1.5 hover:bg-[#F3F2F1] rounded-sm text-[#605E5C]">
                     <MoreHorizontal size={18} />
                  </button>
               </div>
            </div>

            {/* Abas */}
            <div className="px-6 border-b border-[#EAEAEA] flex gap-6">
               {["Details", "7pace Timetracker", "History", "Links", "Attachments"].map((tab, i) => (
                 <button 
                   key={tab} 
                   className={cn(
                     "py-2 text-xs font-semibold transition-colors border-b-2",
                     i === 0 ? "border-[#0078D4] text-[#201F1E]" : "border-transparent text-[#605E5C] hover:text-[#201F1E]"
                   )}
                 >
                   {tab}
                 </button>
               ))}
            </div>

            {/* Conteúdo do Work Item (Simplificado) */}
            <div className="flex-1 flex p-6 gap-8">
               {/* Lado Esquerdo */}
               <div className="flex-1 flex flex-col gap-6">
                  <div>
                     <h3 className="text-xs font-bold text-[#201F1E] mb-2 uppercase tracking-tight">Descrição</h3>
                     <div className="min-h-[100px] border border-transparent hover:border-[#C8C6C4] p-2 text-sm text-[#605E5C] cursor-text transition-colors">
                        Clique para adicionar uma descrição...
                     </div>
                  </div>
                  <div>
                     <h3 className="text-xs font-bold text-[#201F1E] mb-2 uppercase tracking-tight">Discussão</h3>
                     <div className="flex gap-3">
                        <div className="w-8 h-8 rounded-full bg-[#0078D4] flex-shrink-0" />
                        <div className="flex-1 border border-[#C8C6C4] p-2 text-sm text-[#A19F9D] rounded-sm">
                           Adicione um comentário. Use # para vincular um item...
                        </div>
                     </div>
                  </div>
               </div>

               {/* Lado Direito (Info) */}
               <div className="w-80 flex flex-col gap-6 border-l border-[#EAEAEA] pl-8">
                  <div className="flex flex-col gap-3">
                     <h3 className="text-xs font-bold text-[#201F1E] uppercase tracking-tight">Status</h3>
                     <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-green-500" />
                        <span className="text-sm">New</span>
                     </div>
                  </div>
                  <div className="flex flex-col gap-3">
                     <h3 className="text-xs font-bold text-[#201F1E] uppercase tracking-tight">Área</h3>
                     <span className="text-sm">DEV</span>
                  </div>
               </div>
            </div>

            {/* Barra Inferior com o Botão Mágico */}
            <div className="px-6 py-3 border-t border-[#EAEAEA] bg-[#FAF9F8] flex items-center justify-between">
               <div className="flex gap-2">
                  <button className="px-4 py-1.5 text-xs font-semibold text-[#0078D4] hover:bg-[#DEECF9] rounded-sm border border-[#0078D4] flex items-center gap-1.5 transition-colors">
                     Start Tracking
                  </button>
                  <button 
                    onClick={() => setIsModalOpen(true)}
                    className="px-4 py-1.5 text-xs font-semibold text-[#201F1E] hover:bg-[#F3F2F1] rounded-sm border border-[#C8C6C4] flex items-center gap-1.5 transition-colors"
                  >
                     <Clock size={14} className="text-[#0078D4]" />
                     Add Time
                  </button>
               </div>
            </div>
         </div>
      </div>

      {/* Nossa nova Modal Reutilizável */}
      <ModalAdicionarTempo 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        taskId="#5"
        taskTitle="C02. Documentação do Projeto"
      />
    </div>
  );
}
