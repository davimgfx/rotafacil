// src/types/index.ts

export interface Bonde {
  id: string;
  criador_id: string;
  origem: string;
  destino: string;
  horario_saida: string;
  vagas_total: number;
  vagas_ocupadas: number;
  observacoes: string | null;
  apenas_mulheres: boolean;
  status: 'ativo' | 'em_andamento' | 'encerrado' | 'cancelado';
  created_at: string;
}

export interface Carona {
  id: string;
  motorista_id: string;
  origem: string;
  destino: string;
  horario: string;
  vagas_total: number;
  vagas_ocupadas: number;
  veiculo: string;
  observacoes: string | null;
  apenas_mulheres: boolean;
  status: 'agendado' | 'em_andamento' | 'encerrado' | 'cancelado';
  created_at: string;
}
