import { Hono } from 'npm:hono';
import { cors } from 'npm:hono/cors';
import { logger } from 'npm:hono/logger';
import { createClient } from 'npm:@supabase/supabase-js@2.49.2';
import * as kv from './kv_store.tsx';

const app = new Hono();

app.use('*', cors());
app.use('*', logger(console.log));

const supabase = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
);

// Tipos
interface Funcionario {
  id: string;
  nome: string;
  cpf: string;
  setor: string;
  salarioBase: number;
  idFlash?: string;
  tipoTransporte: 'Flash' | 'BHBus' | 'Nenhum';
  diasHomeOfficeNoMes: number;
  valorPassagemBhBus?: number;
  ativo: boolean;
  aniversario?: string;
}

interface Setor {
  id: string;
  nome: string;
  valorFlashDiario: number;
}

interface FeriadoOuEmenda {
  id: string;
  data: string;
  tipo: 'feriado' | 'emenda';
  descricao: string;
}

interface LancamentoFalta {
  funcionarioId: string;
  mes: string;
  faltas: number;
}

interface LancamentoCoparticipacao {
  funcionarioId: string;
  mes: string;
  valor: number;
}

// ============ FUNCIONÁRIOS ============
app.get('/make-server-262f7ff4/funcionarios', async (c) => {
  try {
    const result = await kv.getByPrefix('funcionario:');
    return c.json(result.map((item: any) => item.value));
  } catch (error) {
    console.log('Error fetching funcionarios:', error);
    return c.json({ error: 'Failed to fetch funcionarios', details: error.message }, 500);
  }
});

app.post('/make-server-262f7ff4/funcionarios', async (c) => {
  try {
    const funcionario: Funcionario = await c.req.json();
    funcionario.id = crypto.randomUUID();
    await kv.set(`funcionario:${funcionario.id}`, funcionario);
    return c.json(funcionario);
  } catch (error) {
    console.log('Error creating funcionario:', error);
    return c.json({ error: 'Failed to create funcionario', details: error.message }, 500);
  }
});

app.put('/make-server-262f7ff4/funcionarios/:id', async (c) => {
  try {
    const id = c.req.param('id');
    const funcionario: Funcionario = await c.req.json();
    funcionario.id = id;
    await kv.set(`funcionario:${id}`, funcionario);
    return c.json(funcionario);
  } catch (error) {
    console.log('Error updating funcionario:', error);
    return c.json({ error: 'Failed to update funcionario', details: error.message }, 500);
  }
});

app.delete('/make-server-262f7ff4/funcionarios/:id', async (c) => {
  try {
    const id = c.req.param('id');
    
    // Verificar se há lançamentos de folha
    const lancamentosPrefix = await kv.getByPrefix(`lancamento:falta:${id}:`);
    if (lancamentosPrefix.length > 0) {
      return c.json({ error: 'Não é possível excluir funcionário com lançamentos de folha' }, 400);
    }
    
    await kv.del(`funcionario:${id}`);
    return c.json({ success: true });
  } catch (error) {
    console.log('Error deleting funcionario:', error);
    return c.json({ error: 'Failed to delete funcionario', details: error.message }, 500);
  }
});

// ============ SETORES ============
app.get('/make-server-262f7ff4/setores', async (c) => {
  try {
    const result = await kv.getByPrefix('setor:');
    return c.json(result.map((item: any) => item.value));
  } catch (error) {
    console.log('Error fetching setores:', error);
    return c.json({ error: 'Failed to fetch setores', details: error.message }, 500);
  }
});

app.post('/make-server-262f7ff4/setores', async (c) => {
  try {
    const setor: Setor = await c.req.json();
    setor.id = crypto.randomUUID();
    await kv.set(`setor:${setor.id}`, setor);
    return c.json(setor);
  } catch (error) {
    console.log('Error creating setor:', error);
    return c.json({ error: 'Failed to create setor', details: error.message }, 500);
  }
});

app.put('/make-server-262f7ff4/setores/:id', async (c) => {
  try {
    const id = c.req.param('id');
    const setor: Setor = await c.req.json();
    setor.id = id;
    await kv.set(`setor:${id}`, setor);
    return c.json(setor);
  } catch (error) {
    console.log('Error updating setor:', error);
    return c.json({ error: 'Failed to update setor', details: error.message }, 500);
  }
});

app.delete('/make-server-262f7ff4/setores/:id', async (c) => {
  try {
    const id = c.req.param('id');
    await kv.del(`setor:${id}`);
    return c.json({ success: true });
  } catch (error) {
    console.log('Error deleting setor:', error);
    return c.json({ error: 'Failed to delete setor', details: error.message }, 500);
  }
});

// ============ FERIADOS E EMENDAS ============
app.get('/make-server-262f7ff4/feriados', async (c) => {
  try {
    const result = await kv.getByPrefix('feriado:');
    return c.json(result.map((item: any) => item.value));
  } catch (error) {
    console.log('Error fetching feriados:', error);
    return c.json({ error: 'Failed to fetch feriados', details: error.message }, 500);
  }
});

app.post('/make-server-262f7ff4/feriados', async (c) => {
  try {
    const feriado: FeriadoOuEmenda = await c.req.json();
    feriado.id = crypto.randomUUID();
    await kv.set(`feriado:${feriado.id}`, feriado);
    return c.json(feriado);
  } catch (error) {
    console.log('Error creating feriado:', error);
    return c.json({ error: 'Failed to create feriado', details: error.message }, 500);
  }
});

app.delete('/make-server-262f7ff4/feriados/:id', async (c) => {
  try {
    const id = c.req.param('id');
    await kv.del(`feriado:${id}`);
    return c.json({ success: true });
  } catch (error) {
    console.log('Error deleting feriado:', error);
    return c.json({ error: 'Failed to delete feriado', details: error.message }, 500);
  }
});

// ============ LANÇAMENTOS DE FALTAS ============
app.post('/make-server-262f7ff4/lancamentos/faltas', async (c) => {
  try {
    const { funcionarioId, mes, faltas }: LancamentoFalta = await c.req.json();
    const key = `lancamento:falta:${funcionarioId}:${mes}`;
    await kv.set(key, { funcionarioId, mes, faltas });
    return c.json({ success: true });
  } catch (error) {
    console.log('Error saving faltas:', error);
    return c.json({ error: 'Failed to save faltas', details: error.message }, 500);
  }
});

app.get('/make-server-262f7ff4/lancamentos/faltas/:funcionarioId/:mes', async (c) => {
  try {
    const funcionarioId = c.req.param('funcionarioId');
    const mes = c.req.param('mes');
    const key = `lancamento:falta:${funcionarioId}:${mes}`;
    const result = await kv.get(key);
    return c.json(result || { faltas: 0 });
  } catch (error) {
    console.log('Error fetching faltas:', error);
    return c.json({ error: 'Failed to fetch faltas', details: error.message }, 500);
  }
});

// ============ LANÇAMENTOS DE COPARTICIPAÇÃO ============
app.post('/make-server-262f7ff4/lancamentos/coparticipacao', async (c) => {
  try {
    const { funcionarioId, mes, valor }: LancamentoCoparticipacao = await c.req.json();
    const key = `lancamento:copart:${funcionarioId}:${mes}`;
    await kv.set(key, { funcionarioId, mes, valor });
    return c.json({ success: true });
  } catch (error) {
    console.log('Error saving coparticipacao:', error);
    return c.json({ error: 'Failed to save coparticipacao', details: error.message }, 500);
  }
});

app.get('/make-server-262f7ff4/lancamentos/coparticipacao/:funcionarioId/:mes', async (c) => {
  try {
    const funcionarioId = c.req.param('funcionarioId');
    const mes = c.req.param('mes');
    const key = `lancamento:copart:${funcionarioId}:${mes}`;
    const result = await kv.get(key);
    return c.json(result || { valor: 0 });
  } catch (error) {
    console.log('Error fetching coparticipacao:', error);
    return c.json({ error: 'Failed to fetch coparticipacao', details: error.message }, 500);
  }
});

// ============ CÁLCULO DE BENEFÍCIOS ============
app.get('/make-server-262f7ff4/calcular-beneficios/:mes', async (c) => {
  try {
    const mes = c.req.param('mes'); // formato: YYYY-MM
    const [ano, mesNum] = mes.split('-').map(Number);

    // Buscar funcionários ativos
    const funcionariosResult = await kv.getByPrefix('funcionario:');
    const funcionarios: Funcionario[] = funcionariosResult
      .map((item: any) => item.value)
      .filter((f: Funcionario) => f.ativo);

    // Buscar setores
    const setoresResult = await kv.getByPrefix('setor:');
    const setores: Setor[] = setoresResult.map((item: any) => item.value);

    // Buscar feriados e emendas do mês
    const feriadosResult = await kv.getByPrefix('feriado:');
    const todosFeriados: FeriadoOuEmenda[] = feriadosResult.map((item: any) => item.value);
    
    const feriadosDoMes = todosFeriados.filter((f) => {
      const dataFeriado = new Date(f.data + 'T00:00:00');
      return dataFeriado.getFullYear() === ano && dataFeriado.getMonth() === mesNum - 1;
    });

    // Calcular dias úteis do mês
    const diasNoMes = new Date(ano, mesNum, 0).getDate();
    const diasFeriados = feriadosDoMes.length;
    
    // Contar fins de semana
    let diasFimDeSemana = 0;
    for (let dia = 1; dia <= diasNoMes; dia++) {
      const data = new Date(ano, mesNum - 1, dia);
      const diaSemana = data.getDay();
      if (diaSemana === 0 || diaSemana === 6) {
        diasFimDeSemana++;
      }
    }

    const diasUteisDoMes = diasNoMes - diasFimDeSemana - diasFeriados;

    // Calcular para cada funcionário
    const calculos = await Promise.all(
      funcionarios.map(async (funcionario) => {
        const setor = setores.find((s) => s.id === funcionario.setor);
        if (!setor) {
          throw new Error(`Setor não encontrado para funcionário ${funcionario.nome}`);
        }

        // Buscar faltas lançadas
        const faltasKey = `lancamento:falta:${funcionario.id}:${mes}`;
        const faltasData = await kv.get(faltasKey);
        const faltas = faltasData?.faltas || 0;

        // Buscar coparticipação lançada
        const copartKey = `lancamento:copart:${funcionario.id}:${mes}`;
        const copartData = await kv.get(copartKey);
        const valorCoparticipacao = copartData?.valor || 0;

        // Calcular dias trabalhados
        const diasHomeOffice = funcionario.diasHomeOfficeNoMes || 0;
        const diasTrabalhadosNoMes = diasUteisDoMes - faltas;
        const diasPresenciais = Math.max(0, diasTrabalhadosNoMes - diasHomeOffice);

        // Calcular VA/VR
        const valorFlash = diasTrabalhadosNoMes * setor.valorFlashDiario;

        // Calcular VT
        let valorValeTransporte = 0;
        if (funcionario.tipoTransporte !== 'Nenhum' && funcionario.valorPassagemBhBus) {
          valorValeTransporte = diasPresenciais * 2 * funcionario.valorPassagemBhBus; // ida e volta
        }

        // Total Flash (apenas para quem recebe pelo Flash)
        const recargaFlashTotal = funcionario.tipoTransporte === 'Flash' 
          ? valorFlash + valorValeTransporte 
          : valorFlash;

        // Para BHBus, o VT não vai no Flash
        if (funcionario.tipoTransporte === 'BHBus') {
          // VT separado já está calculado em valorValeTransporte
        } else if (funcionario.tipoTransporte === 'Nenhum') {
          // Sem VT
          valorValeTransporte = 0;
        }

        // Calcular salário final
        const salarioFinal = funcionario.salarioBase - valorCoparticipacao;

        return {
          id: funcionario.id,
          nome: funcionario.nome,
          cpf: funcionario.cpf,
          setor: setor.nome,
          salarioBase: funcionario.salarioBase,
          tipoTransporte: funcionario.tipoTransporte,
          idFlash: funcionario.idFlash,
          diasTrabalhadosNoMes,
          diasPresenciais,
          diasHomeOffice,
          faltas,
          valorFlash,
          valorValeTransporte: funcionario.tipoTransporte === 'BHBus' ? valorValeTransporte : 0,
          recargaFlashTotal,
          valorCoparticipacao,
          salarioFinal
        };
      })
    );

    return c.json({
      mes,
      feriadosEEmendasDoMes: feriadosDoMes,
      diasUteisDoMes,
      calculos
    });
  } catch (error) {
    console.log('Error calculating beneficios:', error);
    return c.json({ error: 'Failed to calculate beneficios', details: error.message }, 500);
  }
});

Deno.serve(app.fetch);
