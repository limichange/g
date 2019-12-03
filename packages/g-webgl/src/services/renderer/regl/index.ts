/**
 * render w/ regl
 * @see https://github.com/regl-project/regl/blob/gh-pages/API.md
 */

import regl from 'regl';
import ReglAttribute from './ReglAttribute';
import ReglBuffer from './ReglBuffer';
import ReglElements from './ReglElements';
import ReglFramebuffer from './ReglFramebuffer';
import ReglModel from './ReglModel';
import ReglTexture2D from './ReglTexture2D';
import { IRendererService, IClearOptions, IReadPixelsOptions } from '../IRendererService';
import { IModel, IModelInitializationOptions } from '../IModel';
import { IAttributeInitializationOptions, IAttribute } from '../IAttribute';
import { IBuffer, IBufferInitializationOptions } from '../IBuffer';
import { IElements, IElementsInitializationOptions } from '../IElements';
import { ITexture2DInitializationOptions, ITexture2D } from '../ITexture2D';
import { IFramebufferInitializationOptions, IFramebuffer } from '../IFramebuffer';

/**
 * regl renderer
 */
export default class ReglRendererService implements IRendererService {
  private gl: regl.Regl;

  public async init($canvas: HTMLCanvasElement): Promise<void> {
    // tslint:disable-next-line:typedef
    this.gl = regl({
      canvas: $canvas,
      attributes: {
        alpha: true,
        // use TAA instead of MSAA
        // @see https://www.khronos.org/registry/webgl/specs/1.0/#5.2.1
        antialias: false,
        premultipliedAlpha: true,
      },
      // TODO: use extensions
      extensions: [
        'OES_element_index_uint',
        'EXT_shader_texture_lod', // IBL
        'OES_standard_derivatives', // wireframe
        'OES_texture_float', // shadow map
        'WEBGL_depth_texture',
        'angle_instanced_arrays',
        'EXT_texture_filter_anisotropic', // VSM shadow map
      ],
      optionalExtensions: ['oes_texture_float_linear'],
    });
  }

  public createModel = (options: IModelInitializationOptions): IModel => new ReglModel(this.gl, options);

  public createAttribute = (options: IAttributeInitializationOptions): IAttribute =>
    new ReglAttribute(this.gl, options);

  public createBuffer = (options: IBufferInitializationOptions): IBuffer => new ReglBuffer(this.gl, options);

  public createElements = (options: IElementsInitializationOptions): IElements => new ReglElements(this.gl, options);

  public createTexture2D = (options: ITexture2DInitializationOptions): ITexture2D =>
    new ReglTexture2D(this.gl, options);

  public createFramebuffer = (options: IFramebufferInitializationOptions) => new ReglFramebuffer(this.gl, options);

  public useFramebuffer = (framebuffer: IFramebuffer | null, drawCommands: () => void) => {
    this.gl({
      framebuffer: framebuffer ? (framebuffer as ReglFramebuffer).get() : null,
    })(drawCommands);
  };

  public clear = (options: IClearOptions) => {
    // @see https://github.com/regl-project/regl/blob/gh-pages/API.md#clear-the-draw-buffer
    const { color, depth, stencil, framebuffer = null } = options;
    const reglClearOptions: regl.ClearOptions = {
      color,
      depth,
      stencil,
    };

    // @ts-ignore
    reglClearOptions.framebuffer = framebuffer === null ? framebuffer : (framebuffer as ReglFramebuffer).get();

    this.gl.clear(reglClearOptions);
  };

  public viewport = ({ x, y, width, height }: { x: number; y: number; width: number; height: number }) => {
    // use WebGL context directly
    // @see https://github.com/regl-project/regl/blob/gh-pages/API.md#unsafe-escape-hatch
    this.gl._gl.viewport(x, y, width, height);
    this.gl._refresh();
  };

  public readPixels = (options: IReadPixelsOptions) => {
    const { framebuffer, x, y, width, height } = options;
    const readPixelsOptions: regl.ReadOptions = {
      x,
      y,
      width,
      height,
    };
    if (framebuffer) {
      readPixelsOptions.framebuffer = (framebuffer as ReglFramebuffer).get();
    }
    return this.gl.read(readPixelsOptions);
  };

  public getViewportSize = () => {
    return {
      width: this.gl._gl.drawingBufferWidth,
      height: this.gl._gl.drawingBufferHeight,
    };
  };

  public destroy = () => {
    // @see https://github.com/regl-project/regl/blob/gh-pages/API.md#clean-up
    this.gl.destroy();
  };
}
