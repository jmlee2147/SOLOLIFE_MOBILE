// 공통 집계
export const Images = {
    common: {
      badge: require("./common/badge.png"),
      bookmark: require("./common/bookmark.png"),
      check: require("./common/check.png"),
      coin: require("./common/coin.png"),
      ctaPlace: require("./common/cta_place.png"),
      ctaRoute: require("./common/cta_route.png"),
      hat: require("./common/hat.png"),
      medal: require("./common/medal.png"),
      mission: require("./common/mission.png"),
    },
  
    backgrounds: {
      main: require("./backgrounds/main_background.png"),
      sample: require("./backgrounds/sample.png"),
    },
  
    gacha: {
      jewels: require("./gacha/jewels.png"),
      textDash: require("./gacha/text_dash.png"),
  
      treasure: {
        closed: require("./gacha/treasure/treasure_close.png"),
        half: require("./gacha/treasure/treasure_half.png"),
        open: require("./gacha/treasure/treasure_open.png"),
        rays: require("./gacha/treasure/treasure_rays.png"),
        static: require("./gacha/treasure/treasure_static.png"),
      },
  
      scroll: {
        // 중앙 정지/완전열림 기본 아트
        static: require("./gacha/scroll/scroll_static.png"),
        // 프레임들(닫힘→열림 순서로 정렬)
        frames: [
          require("./gacha/scroll/scroll_f0_close.png"),
          // 파일명이 섞여 있어도 여기서 '의도 순서'로 정렬해 둔다
          require("./gacha/scroll/scroll_f3_quarter.png"),
          require("./gacha/scroll/scroll_f1_half.png"),
          require("./gacha/scroll/scroll_f2_threequarters.png"),
          require("./gacha/scroll/scroll_f4_open.png"),
        ],
      },
  
      widgets: {
        scroll: require("./gacha/widgets/widgets_scroll.png"),
        shop: require("./gacha/widgets/widgets_shop.png"),
        treasure: require("./gacha/widgets/widgets_treasure.png"),
      },
    },
  
    monkey: {
      run: require("./monkey/monkey_run.png"),
      write: require("./monkey/monkey_write.png"),
    },
  
    placeholder: {
      map: require("./placeholder/map_placeholder.png"),
      monkeyBoard: require("./placeholder/monkey_placeholder_board.png"),
      monkeyList: require("./placeholder/monkey_placeholder_list.png"),
    },
  
    places: {
      activity: require("./places/activity.png"),
      cafe: require("./places/cafe.png"),
      eat: require("./places/eat.png"),
      shopping: require("./places/shopping.png"),
    },
  };
  
  // ---------- 헬퍼 ----------
  
  /** 스크롤(배경 뽑기) 프레임: progress(0~1) -> 해당 이미지 */
  export function getScrollFrame(progress = 0) {
    const frames = Images.gacha.scroll.frames;
    const p = Math.max(0, Math.min(1, progress));
    const idx = Math.round(p * (frames.length - 1));
    return frames[idx];
  }
  
  /** TreasureOpening에 바로 꽂아쓸 source 세트 (상자) */
  export function getTreasureSources() {
    const t = Images.gacha.treasure;
    return { closed: t.closed, mid: t.half, open: t.open, rays: t.rays };
  }
  
  /** TreasureOpening에 바로 꽂아쓸 source 세트 (두루마리 0/2/4프레임) */
  export function getScrollSources() {
    const s = Images.gacha.scroll.frames;
    // 0=닫힘, 2=중간, 4=열림
    return { closed: s[0], mid: s[2], open: s[4], rays: Images.gacha.treasure.rays };
  }