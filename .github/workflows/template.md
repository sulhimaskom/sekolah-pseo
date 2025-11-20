name: oc - [nama workflow]

on:
  schedule:
    - cron: '* * * * *'[sesuaikan jadwal]
  workflow_dispatch:

permissions:[setting sesuai peran]
  id-token: write
  contents: write
  pull-requests: write
  issues: write
  actions: write

# global lock: only 1 instance of this workflow running across events
concurrency:
  group: ${{ github.workflow }}-global
  cancel-in-progress: false

jobs:
  opencode:
    name: OC [nama workflow]
    runs-on: self-hosted
    timeout-minutes: 40
    permissions: [setting sesuai peran]
      id-token: write
      contents: write
      pull-requests: write
      issues: write
      actions: write
      
    env:
      GH_TOKEN: ${{ secrets.GH_TOKEN }}
      IFLOW_API_KEY: ${{ secrets.IFLOW_API_KEY }}
      
    steps:
      - name: Checkout
        uses: actions/checkout@v5
        with:
          fetch-depth: 1
      - name: Install OpenCode CLI
        run: |
          curl -fsSL https://opencode.ai/install | bash
          echo "$HOME/.opencode/bin" >> $GITHUB_PATH
      - name: Run [nama workflow]
        id: run_[nama workflow]
        timeout-minutes: 20
        run: |
          opencode run "$(cat <<'PROMPT'
            ========================================
            PERAN
            ========================================
            Anda adalah [jelaskan peran dan spesialisasi]. 
            Anda berada di lingkungan github action. 
            (tambahkan github user dan email untuk commit push dll)

            ========================================
            KEMAMPUAN
            ========================================
            1. 
            2.
            3.
            4.
            5.
            
            ========================================
            TUGAS
            ========================================
            1. 
            ----------------------------------------
            - 
            - 
            - 

            2. 
            ----------------------------------------
            - 
            - 
            - 
            - 

            3. 
            ----------------------------------------
            - 
            - 
            - 
            - 
            - 
            4. 
            ----------------------------------------
            - 
            - 
            - 

            5. 
            ----------------------------------------
            - 
            - 
            - 
            - 
            ========================================
            LANGKAH KERJA
            ========================================
            1. Analisis
            ----------------------------------------
            - 
            - 
            - 

            2. Planning
            ----------------------------------------
            - 
            - 
            - 
            - 

            3. Implementasi
            ----------------------------------------
            - 
            - 
            - 
            - 
            - 
            4. Review & Test
            ----------------------------------------
            - 
            - 
            - 

            5. Buat PR/Push
            ----------------------------------------
            - 
            - 
            - 
            - 
            ========================================
            INDIKATOR TUGAS SELESAI
            ========================================
            1. 
            ----------------------------------------
            - 
            - 
            - 

            2. 
            ----------------------------------------
            - 
            - 
            - 
            - 

            3. 
            ----------------------------------------
            - 
            - 
            - 
            - 
            - 
            4. 
            ----------------------------------------
            - 
            - 
            - 

            5. 
            ----------------------------------------
            - 
            - 
            - 
            - 

          PROMPT
          )" \
            --model iflowcn/[pilih satu:tstars2.0,qwen3-vl-plus,qwen3-max-preview,qwen3-max,qwen3-coder-plus,qwen3-coder,qwen3-32b,qwen3-235b-a22b-thinking-2507,qwen3-235b-a22b-instruct,qwen3-235b,minimax-m2,kimi-k2-0905,kimi-k2,glm-4.6,deepseek-v3.2,deepseek-v3.1,deepseek-v3] \
            --share false \