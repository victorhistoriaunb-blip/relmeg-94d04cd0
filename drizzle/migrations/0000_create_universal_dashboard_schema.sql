CREATE TABLE public.datasets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  name text NOT NULL DEFAULT 'Minha base',
  columns jsonb NOT NULL DEFAULT '[]'::jsonb,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.datasets TO authenticated;
GRANT ALL ON public.datasets TO service_role;
ALTER TABLE public.datasets ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Usuarios gerenciam suas bases" ON public.datasets FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE INDEX datasets_user_active_idx ON public.datasets (user_id, is_active);
CREATE TRIGGER update_datasets_updated_at BEFORE UPDATE ON public.datasets FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TABLE public.data_records (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  dataset_id uuid NOT NULL REFERENCES public.datasets(id) ON DELETE CASCADE,
  data jsonb NOT NULL DEFAULT '{}'::jsonb,
  position integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.data_records TO authenticated;
GRANT ALL ON public.data_records TO service_role;
ALTER TABLE public.data_records ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Usuarios gerenciam seus registros" ON public.data_records FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE INDEX data_records_dataset_position_idx ON public.data_records (dataset_id, position);
CREATE INDEX data_records_user_idx ON public.data_records (user_id);
CREATE TRIGGER update_data_records_updated_at BEFORE UPDATE ON public.data_records FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TABLE public.dashboard_widgets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  dataset_id uuid NOT NULL REFERENCES public.datasets(id) ON DELETE CASCADE,
  title text NOT NULL DEFAULT 'Novo dashboard',
  description text NOT NULL DEFAULT '',
  chart_type text NOT NULL DEFAULT 'bar',
  category_column text NOT NULL DEFAULT '',
  value_column text,
  aggregation text NOT NULL DEFAULT 'count',
  item_limit integer NOT NULL DEFAULT 10,
  position integer NOT NULL DEFAULT 0,
  is_visible boolean NOT NULL DEFAULT true,
  is_featured boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.dashboard_widgets TO authenticated;
GRANT ALL ON public.dashboard_widgets TO service_role;
ALTER TABLE public.dashboard_widgets ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Usuarios gerenciam seus dashboards" ON public.dashboard_widgets FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE INDEX dashboard_widgets_dataset_position_idx ON public.dashboard_widgets (dataset_id, position);
CREATE INDEX dashboard_widgets_user_idx ON public.dashboard_widgets (user_id);
CREATE TRIGGER update_dashboard_widgets_updated_at BEFORE UPDATE ON public.dashboard_widgets FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

COMMENT ON TABLE public.parlamentares IS 'DEPRECATED: substituida pelo modelo universal datasets/data_records';